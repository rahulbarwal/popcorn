import { Router } from "express";
import dashboardRoutes from "./dashboard";
import supplierRoutes from "./suppliers";

const router = Router();

// Dashboard routes
router.use("/dashboard", dashboardRoutes);

// Supplier routes
router.use("/suppliers", supplierRoutes);

export default router;
