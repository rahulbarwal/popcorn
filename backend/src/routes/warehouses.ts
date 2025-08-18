import { Router } from "express";
import { ProductManagementController } from "../controllers/ProductManagementController";

const router = Router();
const productController = new ProductManagementController();

// Warehouse routes for product management
router.get("/", productController.getWarehouses.bind(productController));

export default router;
