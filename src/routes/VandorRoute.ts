import express, { Request, Response, NextFunction } from "express";
import {
  AddFood,
  AddOffer,
  EditOffer,
  GetAllVenders,
  GetFoodById,
  GetFoods,
  GetOffers,
  GetOrderDetails,
  GetOrders,
  GetVendorById,
  GetVendorProfile,
  ProcessOrder,
  UpdateVendorCoverImage,
  UpdateVendorProfile,
  UpdateVendorService,
  VendorLogin,
} from "../controllers";
import { Authenticate } from "../middleware";
import multer from "multer";
import { limiter } from "../utility/rateLimiter";

const router = express.Router();

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + "_" + file.originalname);
  },
});

const images = multer({ storage: imageStorage }).array("images", 10);

router.post("/login", limiter, VendorLogin);

router.use(Authenticate);

// vendors
router.get("/getAll", GetAllVenders);
router.get("/:id", GetVendorById);

router.get("/profile", GetVendorProfile);
router.patch("/profile", UpdateVendorProfile);

router.patch("/coverimage", images, UpdateVendorCoverImage);
router.patch("/service", UpdateVendorService);

// foods
router.get("/food", GetFoods);
router.get("/food/:id", GetFoodById);
router.post("/food", images, AddFood);

// orders;
router.get("/orders", GetOrders);
router.put("/order/:id/process", ProcessOrder);
router.get("/order/:id", GetOrderDetails);

//Offers
router.get("/offers", GetOffers);
router.post("/offer", AddOffer);
router.put("/offer/:id", EditOffer);

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Hello from Vandor" });
});

export { router as VandorRoute };
