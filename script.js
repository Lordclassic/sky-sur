const backendUrl =
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000" // Local backend for development
    : "https://your-backend.vercel.app"; // Deployed backend for production

document

  .getElementById("registrationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevents default form submission

    const form = document.getElementById("registrationForm");
    const formData = new FormData(form); // Collect form data

    // Log form data to ensure fields are being captured
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    // Send the form data to the server
    fetch(`${backendUrl}/send-email`, {
      method: "POST",
      body: formData, // Send form data with file attached
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(err.error || "Failed to send email");
          });
        }
        return response.json();
      })
      .then((data) => {
        alert(data.message); // Show success message to the user
      })
      .catch((error) => {
        console.error("Error:", error);
        alert(error.message || "An error occurred. Please try again.");
      });
  });
