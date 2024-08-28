import dotenv from "dotenv";

dotenv.config();
export const MONGO_URI = process.env.MONGO_URI;
export const APP_SECRET = "238745623hsdf";

export const PORT = process.env.PORT || 8000;
