const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const flash = require("express-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const multer = require("multer");
router.use(express.static("upload"));
const connectToDatabase = require("../database/config");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const uuid = require("uuid");
const { runAllChains } = require("express-validator/src/utils");
const { randomUUID } = require("crypto");

/*************** cookie parser   ************************/

router.use(cookieParser());
const oneDayMilliseconds = 24 * 60 * 60 * 1000;
const expiresDate = new Date(Date.now() + oneDayMilliseconds);

router.use(
  session({
    key: "user_sid",
    secret: "domeranddonstuffs",
    resave: true,
    saveUninitialized: true,
    cookie: {
      expires: expiresDate, // Set cookie expiration to 1 day (24 hours)
    },
  })
);

router.use(flash()); // flash

/*************** cookie parser  end  ************************/

/******************* use database   **************************/
async function startApplication() {
  try {
    const db = await connectToDatabase();
    return db;
  } catch (error) {
    console.error("Error starting the application:", error);
    throw error;
  }
}

/******************* use database  end  **************************/

// *************************************** upload file
const storage = multer.diskStorage({
  destination: (rew, file, cb) => {
    cb(null, "./upload");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
    // cb(null, uuidv4()+ '-' + Date.now() + Path2D.extname(file.originalname)) //Appending
  },
});
const filefilter = (req, file, cb) => {
  const allowedFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
let upload = multer({ storage, filefilter });
// *************************************** upload file picture end

router.get("/", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  const db = await startApplication();
  const collection = db.collection("cars");
  const carData = await collection.find({}).toArray();

  const { userid } = req.session.user;
  const firstLetter = userid.charAt(0).toUpperCase();
  res.render("index", { firstLetter, carData });
});

/**************************************************** register start ****************************************************/
router.get("/api/register", (req, res) => {
  const message = req.query.message;
  res.render("common/usereg", { message });
});

router.post("/api/user", upload.single("picturs"), async (req, res) => {
  const { email, password, userid, location } = req.body;
  const picturs = req.file.filename;

  try {
    const db = await startApplication();

    const existingUser = await db
      .collection("users")
      .findOne({ $or: [{ email }, { userid }] });
    if (existingUser) {
      req.flash("error", "Userid or email already exists");
      return res.redirect("/api/register");
    }

    if (!password || password.length < 6) {
      req.flash("error", "Password must be at least 6 characters long");
      return res.redirect("/api/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      userid,
      location,
      picturs,
      roll: 0,
      date: new Date(),
    });

    req.flash("success", "Registration successful");
    res.redirect("/api/login");
  } catch (error) {
    console.error(error);
    req.flash("error", "Internal server error");
    res.redirect("/api/register");
  }
});

/**************************************************** register end ****************************************************/

/*############################################################# Admin Dashboard Start ################################*/

router.get("/dashboard", (req, res) => {
  const user = req.session.user;

  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  if (user.roll === 0) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  if (user.roll === 2) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/dealership-dashboard"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }

  const { userid } = req.session.user;
  const firstLetter = userid.charAt(0).toUpperCase();
  res.render("Admin-dashboard/index", { firstLetter, user });
});

/**************************  Dealership start   *********************************************/
router.get("/dealership", (req, res) => {
  const user = req.session.user;

  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  if (user.roll === 0) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  if (user.roll === 2) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/dealership-dashboard"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }

  const { userid } = req.session.user;
  const firstLetter = userid.charAt(0).toUpperCase();
  res.render("Admin-dashboard/dealership", { firstLetter, user });
});

router.post("/dealership", upload.single("images"), async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const db = await startApplication();

    const dealership = {
      email: req.body.email,
      userid: req.body.userid,
      dealership_name: req.body.name,
      location: req.body.location,
      password: hashedPassword,
      images: req.file.filename,
      cars: req.body.cars,
      deals: req.body.deals,
      sold_vehicles: req.body.sold_vehicles,
      roll: 2,
      date: new Date(),
    };

    await db.collection("dealerships").insertOne(dealership);

    await db.client.close();

    res.redirect("/dealership");
  } catch (err) {
    console.error(err);
    res.status(400).json("Error: " + err);
  }
});
/**************************  Dealership start   *********************************************/

/**************************  sold_vehicles start   *********************************************/
router.get("/sold_vehicles", (req, res) => {
  const user = req.session.user;

  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  if (user.roll === 0) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  if (user.roll === 2) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/dealership-dashboard"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  const { userid } = req.session.user;
  const firstLetter = userid.charAt(0).toUpperCase();
  res.render("Admin-dashboard/sold_vehicles", { firstLetter, user });
});
router.post("/vehicle", upload.single("picture"), async (req, res) => {
  try {
    const db = await startApplication();

    const vehicle = {
      vehicleid: req.body.vehicleid,
      carid: req.body.carid,
      picture: req.file.filename,
      date: new Date(),
    };
    await db.collection("vehicles").insertOne(vehicle);
    await db.client.close();
    res.redirect("/sold_vehicles");
  } catch (err) {
    console.error("Error:", err);
    res
      .status(400)
      .json({ error: "Error occurred while processing the request" });
  }
});
/**************************  sold_vehicles end   *********************************************/

/**************************  cars start   *********************************************/
router.get("/cars", async (req, res) => {
  const user = req.session.user;

  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  if (user.roll === 0) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  if (user.roll === 2) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/dealership-dashboard"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  const { userid } = req.session.user;
  const firstLetter = userid.charAt(0).toUpperCase();
  res.render("Admin-dashboard/cars", { firstLetter, user });
});
router.post("/cars", upload.single("pic"), async (req, res) => {
  try {
    const db = await startApplication();

    const cars = {
      carid: req.body.carid,
      name: req.body.name,
      type: req.body.type,
      modal: req.body.modal,
      price: req.body.price,
      pic: req.file.filename,
      date: new Date(),
    };
    await db.collection("cars").insertOne(cars);
    await db.client.close();

    res.redirect("/cars");
  } catch (err) {
    console.error("Error:", err);
    res
      .status(400)
      .json({ error: "Error occurred while processing the request" });
  }
});
router.get("/view_car", async (req, res) => {
  const user = req.session.user;

  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  if (user.roll === 0) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  if (user.roll === 2) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/dealership-dashboard"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  if (user.roll === 2) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  try {
    const db = await startApplication();
    const collection = db.collection("cars");
    const carData = await collection.find({}).toArray();
    const success = req.query.success === "true";

    const { userid } = req.session.user;
    const firstLetter = userid.charAt(0).toUpperCase();
    res.render("Admin-dashboard/view_Car", {
      firstLetter,
      carData,
      success,
      user,
    });
  } catch (error) {
    console.error("Error retrieving car data:", error);
    res.status(500).send("Error retrieving car data");
  }
});
router.get("/delete_4/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await startApplication();
    const collection = db.collection("cars");
    const del = await collection.deleteOne({ _id: new ObjectId(id) });

    if (del.deletedCount === 1) {
      res.redirect("/view_Car?success=true");
    } else {
      res.status(404).send("Item not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting item");
  }
});
router.get("/edit_4/:id", async (req, res) => {
  try {
    const db = await startApplication();
    const collection = db.collection("cars");
    const editcar = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!editcar) {
      return res.status(404).send("Car item not found");
    }

    const { userid } = req.session.user;
    const firstLetter = userid.charAt(0).toUpperCase();

    res.render("Admin-dashboard/edit_Car", { editcar, firstLetter });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data for editing");
  }
});
router.post("/edit_4/:id", upload.single("pic"), async (req, res) => {
  try {
    const itemId = req.params.id;

    // Check if itemId is a valid ObjectId
    if (!ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const caredit = {
      carid: req.body.carid,
      name: req.body.name,
      type: req.body.type,
      modal: req.body.modal,
      price: req.body.price,
      pic: req.file.filename,
    };

    const db = await startApplication();
    const collection = db.collection("cars");

    // Attempt to update the car document
    const updateResult = await collection.findOneAndUpdate(
      { _id: new ObjectId(itemId) },
      { $set: caredit },
      { returnOriginal: false }
    );

    // Check if the update was successful
    if (updateResult.value) {
      return res.status(404).json({ message: "Car item not found" });
    }

    // Log the updated car document
    console.log("Car updated successfully:", updateResult.value);

    // Redirect to the view car page upon successful update
    return res.redirect("/view_car");
  } catch (err) {
    // Handle errors
    console.error("Error updating car:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
/**************************  cars end   *********************************************/

/**************************  cars start   *********************************************/
router.get("/deal", (req, res) => {
  const user = req.session.user;

  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  if (user.roll === 0) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  if (user.roll === 2) {
    const errorMessage = "You do not have permission to access the dashboard.";
    return res.status(403).send(`
      <script>
        alert("${errorMessage}");
        window.location.href = "/dealership-dashboard"; // Redirect the user to a different page after displaying the alert
      </script>
    `);
  }
  const { userid } = req.session.user;
  const firstLetter = userid.charAt(0).toUpperCase();
  res.render("Admin-dashboard/deal", { firstLetter, user });
});
router.post("/deal", upload.single("pics"), async (req, res) => {
  try {
    const db = await startApplication();

    const deal = {
      carid: req.body.carid,
      dealid: req.body.dealid,
      pics: req.file.filename,
      date: new Date(),
    };
    await db.collection("deals").insertOne(deal);
    await db.client.close();

    res.redirect("/deal");
  } catch (err) {
    console.error("Error:", err);
    res
      .status(400)
      .json({ error: "Error occurred while processing the request" });
  }
});
/**************************  cars end   *********************************************/

/************************* generate web token and forgot passwrod  start **********************/
const secretKey = "your_secret_key";
function generateJWT() {
  const payload = {
    token_id: uuid.v4(),
    timestamp: Date.now(),
  };
  const options = {
    expiresIn: "1m", // Token expires in 1 minute
  };
  return jwt.sign(payload, secretKey, options);
}
router.get("/loing/forgot-password", (req, res) => {
  const token = req.query.token;
  res.render("common/changepassword", { token });
});

/******* email submit *  ********/
router.post("/submitemail", async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email } = req.body;

  try {
    const db = await startApplication();

    const user = await db.collection("users").findOne({ email });
    const dealership = await db.collection("dealerships").findOne({ email });

    if (!user && !dealership) {
      req.flash("error", "Your email does not exist");
      return res.redirect("/loing/forgot-password");
    }

    const token = generateJWT();

    // Store token in session
    req.session.resetToken = token;
    req.session.email = email;

    if (user) {
      await db.collection("users").updateOne({ email }, { $set: { resetToken: token } });
    } else {
      await db.collection("dealerships").updateOne({ email }, { $set: { resetToken: token } });
    }

    res.redirect(`/api/createpassword`);

    setTimeout(async () => {
      try {
        await db
          .collection("users")
          .updateOne({ email }, { $unset: { resetToken: "" } });
        console.log("Token deleted from database after expiration");
      } catch (error) {
        console.error("Error deleting token from database:", error);
      }
    }, 60000);
  } catch (error) {
    console.error("Error submitting email:", error);
    req.flash("error", "Internal Server Error");
    res.status(500).send("Internal Server Error");
  }
});

router.get("/api/createpassword", (req, res) => {
  const token = req.query.token;
  const email = req.session.email;
  res.render("common/createpassword", { token, email });
});

router.post("/changepassword", async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const token = req.session.resetToken;

  try {
    const db = await connectToDatabase();

    const decoded = jwt.verify(token, secretKey);

    if (newPassword !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.status(400).redirect("/api/createpassword");
    }

    if (newPassword.length < 6) {
      req.flash("error", "Password must be at least 6 characters long");
      return res.status(400).redirect("/api/createpassword");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const users = await db .collection("users") .updateOne(  { resetToken: token }, { $set: { password: hashedPassword }, $unset: { resetToken: "" } }  );
    const dealerships = await db .collection("dealerships") .updateOne(  { resetToken: token }, { $set: { password: hashedPassword }, $unset: { resetToken: "" } }  );

   
    if (users.modifiedCount > 0 || dealerships.modifiedCount > 0) {
      req.flash("success", "Password changed successfully");
      return res.redirect("/");
    } else {
      req.flash("error", "Failed to change password");
      return res.status(500).redirect("/api/createpassword");
    }
  } catch (error) {
    console.error("Error changing password:", error);
    req.flash("error", "Token is expire");
    return res.status(500).redirect("/api/createpassword");
  }
});

/************************* generate web token and forgot passwrod  end **********************/

/*############################################################# Admin Dashboard end ################################*/

/*############################################################# Dealership Dashboard start ################################*/

router.get("/dealership-dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  const { userid } = req.session.user;
  const firstLetter = userid.charAt(0).toUpperCase();
  res.render("dealership-dashboard/de-index", { firstLetter });
});

router.get("/user-visit", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  const db = await startApplication();
  const collection = db.collection("cars-2");
  const carData = await collection.find({}).toArray();
  const { userid } = req.session.user;
  const firstLetter = userid.charAt(0).toUpperCase();
  res.render("dealership-dashboard/view_readmoreData", {
    firstLetter,
    carData,
  });
});
router.get("/delete_5/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await startApplication();
    const collection = db.collection("cars-2");
    const del = await collection.deleteOne({ _id: new ObjectId(id) });

    if (del.deletedCount === 1) {
      res.redirect("/user-visit");
    } else {
      res.status(404).send("Item not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting item");
  }
});
/*############################################################# Dealership Dashboard end ################################*/

/******************************** product user visit start ***************************/ 
router.get("/readmore/:id", async (req, res) => {
  const carId = req.params.id;

  if (!carId || !ObjectId.isValid(carId)) {
    return res.status(400).send("Invalid or missing car ID");
  }
  if (!req.session.user) {
    return res.redirect("/api/login");
  }
  const { userid } = req.session.user;
  const firstLetter = userid.charAt(0).toUpperCase();

  try {
    if (!ObjectId.isValid(carId)) {
      return res.status(400).send("Invalid car ID");
    }
    const db = await startApplication();
    const car = await db
      .collection("cars")
      .findOne({ _id: new ObjectId(carId) });

    if (!car) {
      return res.status(404).send("Car not found");
    }
    res.render("readmore", { car: car, firstLetter });
  } catch (error) {
    console.error("Error fetching car:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/api/usre-data", upload.single("pic2"), async (req, res) => {
  try {
    const carData = {
      carid2: req.body.carid2,
      name2: req.body.name2,
      modal2: req.body.modal2,
      type2: req.body.type2,
      price2: req.body.price2,
      pic2: req.body.pic2, // Assuming 'pic2' is a file upload field
      date: new Date(),
    };
    const db = await startApplication();
    const result = await db.collection("cars-2").insertOne(carData);
    const selectid = await db.collection("cars").findOne({});

    res.redirect(`/readmore/${selectid._id}`);
  } catch (err) {
    console.error("Error:", err);
    res
      .status(400)
      .json({ error: "Error occurred while processing the request" });
  }
});
/******************************** product user visit end ***************************/ 


/**************************  Login start  *********************************************/
router.get("/api/login", (req, res) => {
  res.render("common/login");
});

router.post("/api/auth/login", async (req, res) => {
  const { userid, password } = req.body;

  try {
    const db = await startApplication();
    const userFromUsers = await db.collection("users").findOne({ userid });

    const userFromDealerships = await db
      .collection("dealerships")
      .findOne({ userid });

    let user;

    if (userFromUsers) {
      user = userFromUsers;
    } else if (userFromDealerships) {
      user = userFromDealerships;
    } else {
      req.flash("error", "Incorrect userid");
      return res.redirect("/api/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      req.flash("userid", userid);
      req.flash("error", "Incorrect password");
      return res.redirect("/api/login");
    }

    if (user.roll == 1) {
      req.session.user = user;
      res.redirect("/dashboard");
    } else if (user.roll == 2) {
      req.session.user = user;
      res.redirect("/dealership-dashboard");
    } else {
      req.session.user = user;
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
});

/**************************  Login end  *********************************************/

router.get("/text-2", (req, res) => {
  res.render("text2");
});

/***************************** Logout Start    ******************************************************/
router.get("/Logout", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie("user_sid");
    res.redirect("/");
  } else {
  }
});

/***************************** Logout Start end   ******************************************************/

// module exports
module.exports = router;
