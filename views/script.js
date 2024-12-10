
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




