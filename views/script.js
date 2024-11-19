
// IMAGE GALLERY
    // Select the modal, modal image, and close button elements
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.getElementById("close");

    // Add event listener to each gallery image to open the modal
    document.querySelectorAll(".gallery-img").forEach(img => {
        img.addEventListener("click", () => {
            modal.style.display = "block";
            modalImg.src = img.src;
        });
    });

    // Add event listener to the close button to close the modal
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Close the modal when clicking outside the image
    modal.addEventListener("click", (e) => {
        if (e.target ==modal) {           // Check if click is outside the modal content
            modal.style.display = "none";   // Hide the modal
        }
    });

    
    function toggleForm(mode) {
        const signupFields = document.querySelectorAll('.signup-only');
        const formTitle = document.getElementById('formTitle');
        const submitButton = document.getElementById('submitButton');
        const toggleText = document.getElementById('toggleText');
        const form = document.getElementById('userForm');
    
        if (mode === 'signup') {
            signupFields.forEach(field => field.style.display = 'block');
            formTitle.textContent = 'Sign Up';
            submitButton.textContent = 'Register';
            form.action = '/signup';  // Change form action to POST /signup
            form.method = 'POST';     // Change form method to POST
            toggleText.innerHTML = 'Already have an account? <a href="#" onclick="toggleForm(\'login\')">Login Here</a>';
        } else {
            signupFields.forEach(field => field.style.display = 'none');
            formTitle.textContent = 'Login';
            submitButton.textContent = 'Login';
            form.action = '/login';  // Change form action to GET /login
            form.method = 'GET';     // Change form method to GET
            toggleText.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleForm(\'signup\')">Register Here</a>';
        }
    }
    


