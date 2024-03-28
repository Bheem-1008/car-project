const express = require("express");
const serverless = require('serverless-http')
const app = express();
const bodyParser = require("body-parser");
const router = require("./controller/auth");
const connectToDatabase = require("./database/config");
const bcrypt = require("bcrypt");
app.set("view engine", "ejs");
app.use(express.static("views"));
app.use(bodyParser.urlencoded({ extended: true }));

const chalk = require("chalk");
const { MongoClient, ObjectId } = require("mongodb");

/********************* database connect ***************************/
async function startApplication() {
  try {
    const db = await connectToDatabase();
  } catch (error) {
    console.error("Error starting the application:", error);
  }
}
startApplication();
/********************* database connect ***************************/


app.use("/", router);
const Port = 8080;
app.listen(Port, () => {
  console.log(chalk.bgBlueBright.white(` Server running on port ${Port}. `));
});
