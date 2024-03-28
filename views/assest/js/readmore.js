
$(document).ready(function () {
    let formSubmitted = false; 
    $("#dealershipForm4").submit(function (event) {
      event.preventDefault(); 
  
      if (!formSubmitted) {
        const formData = new FormData(this);
        $.ajax({
          type: "POST",
          url: "/api/usre-data",
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
        window.location.href = `/readmore/${selectid._id}`;
      } else {
        window.location.href = `/readmore/${selectid._id}`;
      }
    });
  });
       
// Smooth modal opening
// $("#modalToggleButton").click(function () {
//   setTimeout(function () {
//     $("#exampleModal").modal("show");
//   }, 4000); // 300 milliseconds delay
// });

// // Close modal on close icon click
// $(".btn-close").click(function () {
//   $("#exampleModal").modal("hide");
// });