$(document).ready(function () {
    let formSubmitted = false; 
    $("#dealershipForm1").submit(function (event) {
      event.preventDefault(); 
  
      if (!formSubmitted) {
        const formData = new FormData(this);
        $.ajax({
          type: "POST",
          url: "/vehicle",
          data: formData,
          contentType: false,
          processData: false,
          success: function (response) {
            // Show success modal
            $("#modalMessage").text("Data sent successfully!");
            $("#exampleModal").modal("show");
            formSubmitted = true;
          },
          error: function () {
            // Show error modal
            $("#modalMessage").text("please fill all  field");
            $("#exampleModal").modal("show");
          },
        });
      }
    });
  
    $("#doneButton").click(function () {
      if (formSubmitted) {
        $("#exampleModal").modal("hide");
        window.location.href = "/sold_vehicles";
      } else {
        window.location.href = "/sold_vehicles";
      }
    });
  });
  