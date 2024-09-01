import express, { Application } from "express";
import path from "path";
import { CustomerRoute } from "../routes/CustomerRoute";
import { ShoppingRoute } from "../routes/ShoppingRoutes";
import { AdminRoute, DeliveryRoute, UploadRoute, VandorRoute } from "../routes";
import dotenv from "dotenv";
import { requestLogger } from "../utility/logger";

export default async (app: Application) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  dotenv.config();
  app.use(express.json());

  app.use(requestLogger);
  const imagePath = path.join(__dirname, "../images");

  app.use("/images", express.static(imagePath));

  app.use("/admin", AdminRoute);
  app.use("/vendor", VandorRoute);
  app.use("/customer", CustomerRoute);
  app.use("/delivery", DeliveryRoute);
  app.use("/upload", UploadRoute);
  app.use(ShoppingRoute);

  return app;
};
