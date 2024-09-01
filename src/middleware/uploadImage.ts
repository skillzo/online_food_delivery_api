import multer from "multer";
import cloudinary from "../config/cloudinary";

const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", // Specify the folder in your Cloudinary account
    allowed_formats: ["jpg", "png", "jpeg", "gif"], // Allowed file formats
  },
});

// Set up multer with Cloudinary storage
const upload = multer({ storage });

export default upload;
