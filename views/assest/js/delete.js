
  // Function to handle delete confirmation
  $('#deleteConfirmationModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var id = button.data('id');
    var deleteType = button.data('delete-type'); // Assuming you have a data attribute named 'data-delete-type' to differentiate between delete_4 and delete_5
    var modal = $(this);
    
    modal.find('#confirmDeleteBtn').click(function () {
      var deleteUrl;
      if (deleteType === 'delete_4') {
        deleteUrl = "/delete_4/" + id;
      } else if (deleteType === 'delete_5') {
        deleteUrl = "/delete_5/" + id;
      } else {
        console.error("Invalid delete type");
        return;
      }
      window.location.href = deleteUrl;
    });
  });

