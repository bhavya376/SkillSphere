import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");
} catch (err) {
  console.error(err);
}

process.exit();