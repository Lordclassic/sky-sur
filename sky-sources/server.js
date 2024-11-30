const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config(); // Load environment variables from .env file

// Dropbox SDK
const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "https://your-frontend.vercel.app", // Your deployed frontend
      "http://127.0.0.1:5500", // Local development frontend
    ],
    methods: ["GET", "POST"], // Allow only the required HTTP methods
    credentials: true, // Include this if you're working with cookies
  })
);

// Middleware to serve static files (e.g., favicon, images)
app.use(express.static(path.join(__dirname, "public")));

// Logging middleware to capture all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("Request Body:", req.body); // Log the request body
  next();
});

// Handle root route ("/")
app.get("/", (req, res) => {
  res.send("Server is running! Welcome to Email Octopus Server.");
});

// Handle favicon requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Configure Multer for file uploads using in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to handle form submission and file upload
app.post("/send-email", upload.single("receipt"), async (req, res) => {
  console.log("Incoming request to /send-email");
  try {
    console.log("Request Body:", req.body); // Log incoming data
    console.log("Uploaded File:", req.file); // Log uploaded file

    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ error: "Request body is empty or invalid." });
    }

    const { firstName, lastName, email, country, dob, age, otherPayment } =
      req.body;

    if (!firstName || !email) {
      return res.json({ error: "First name and email are required" });
    }

    // Dropbox integration: Initialize Dropbox with the access token
    const dbx = new Dropbox({
      accessToken: process.env.DROPBOX_ACCESS_TOKEN,
      fetch: fetch,
    });

    // Upload the file to Dropbox
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;

      try {
        const dropboxResponse = await dbx.filesUpload({
          path: `/${fileName}`, // Path in Dropbox (root folder)
          contents: fileBuffer,
        });
        console.log("File uploaded to Dropbox:", dropboxResponse);
      } catch (error) {
        console.error("Error uploading file to Dropbox:", error);
        return res
          .status(500)
          .json({ error: "Failed to upload file to Dropbox." });
      }
    }

    // Nodemailer transport configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "New Registration with Receipt",
      html: `
        <h1>New Registration</h1>
        <p><strong>First Name:</strong> ${firstName}</p>
        <p><strong>Last Name:</strong> ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Date of Birth:</strong> ${dob}</p>
        <p><strong>Age:</strong> ${age}</p>
        <p><strong>Other Payment:</strong> ${otherPayment}</p>
      `,
      attachments: req.file
        ? [{ filename: req.file.originalname, content: req.file.buffer }]
        : [],
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Info sent successfully! We will get back to you soon!",
    });
  } catch (error) {
    console.error("Error in /send-email route:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
