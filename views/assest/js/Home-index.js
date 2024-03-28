  // JavaScript for handling button clicks and section navigation
  document.getElementById('button1').addEventListener('click', function() {
    document.getElementById('section1').style.display = 'block'; // Show section 1
    document.getElementById('section2').style.display = 'none'; // Hide section 2
    // Set Button 1 as active, remove active class from Button 2
    document.getElementById('button1').classList.add('active-button');
    document.getElementById('button2').classList.remove('active-button');
  });

  document.getElementById('button2').addEventListener('click', function() {
    document.getElementById('section1').style.display = 'none'; // Hide section 1
    document.getElementById('section2').style.display = 'block'; // Show section 2
    // Set Button 2 as active, remove active class from Button 1
    document.getElementById('button2').classList.add('active-button');
    document.getElementById('button1').classList.remove('active-button');
  });