import { Router } from "express";
import dashboardRoutes from "./dashboard";
import supplierRoutes from "./suppliers";
import productRoutes from "./products";
import warehouseRoutes from "./warehouses";

const router = Router();

// Dashboard routes
router.use("/dashboard", dashboardRoutes);

// Supplier routes
router.use("/suppliers", supplierRoutes);

// Product management routes
router.use("/products", productRoutes);

// Warehouse routes
router.use("/warehouses", warehouseRoutes);

export default router;
