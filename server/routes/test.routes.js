import express from "express";
import { getTest } from "../controllers/test.controller.js";
const router = express.Router();

router.get("/test", getTest);

export default router;