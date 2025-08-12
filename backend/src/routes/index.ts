import { Router } from "express";
import dashboardRoutes from "./dashboard";

const router = Router();

// Dashboard routes
router.use("/dashboard", dashboardRoutes);

export default router;
