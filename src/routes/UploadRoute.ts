import express from "express";
import upload from "../middleware/uploadImage";

const router = express.Router();

router.post("/upload", upload.single("image"), (req, res) => {
  console.log("req", req.file);
  if (!req.file) {
    return res.status(400).json({ message: "No image file uploaded" });
  }

  // req.file contains the uploaded file info, including the Cloudinary URL
  res.status(200).json({
    message: "Image uploaded successfully",
    imageUrl: req.file.path, // The URL of the uploaded image on Cloudinary
  });
});

export { router as UploadRoute };
