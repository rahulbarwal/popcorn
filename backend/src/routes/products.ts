import { Router } from "express";
import { ProductManagementController } from "../controllers/ProductManagementController";

const router = Router();
const productController = new ProductManagementController();

// Product management routes
router.get("/", productController.getProducts.bind(productController));
router.get(
  "/categories",
  productController.getCategories.bind(productController)
);
router.get(
  "/validate-sku/:sku",
  productController.validateSku.bind(productController)
);
router.get("/:id", productController.getProductById.bind(productController));
router.post("/", productController.createProduct.bind(productController));
router.put("/:id", productController.updateProduct.bind(productController));
router.delete("/:id", productController.deleteProduct.bind(productController));

// Inline editing routes
router.patch(
  "/:id/inline",
  productController.updateInlineField.bind(productController)
);
router.put(
  "/:id/fields",
  productController.bulkUpdateFields.bind(productController)
);

export default router;
