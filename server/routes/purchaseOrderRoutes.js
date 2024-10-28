const express = require("express");
const router = express.Router();
const purchaseOrderController = require("../controller/purchaseOrderController");
const authMiddleware = require("../middlewares/auth");
const { body, param } = require("express-validator");
const {validateRequest} = require("../utils/validation")

  

// Input validation middleware
const createPOValidation = [
  body("items").isArray().notEmpty().withMessage("Items are required"),
];

const updatePOValidation = [
  body("status").isIn(["pending", "approved", "rejected"]).optional(),
];

// Group routes with common middleware
// router.use(authMiddleware);

// Create a new purchase order
router.post("/add", createPOValidation, validateRequest, authMiddleware, purchaseOrderController.createPurchaseOrder);

// Get purchase order by ID
router.get("/:id", param("id").isMongoId(), validateRequest,authMiddleware, purchaseOrderController.getPurchaseOrderById);

// Update purchase order
router.put("/:id", param("id").isMongoId(), updatePOValidation, validateRequest,authMiddleware , purchaseOrderController.updatePurchaseOrder);

// Delete purchase order
router.delete("/:id", param("id").isMongoId(), validateRequest,authMiddleware , purchaseOrderController.deletePurchaseOrder);

// Get total of purchase orders
router.get("/total", authMiddleware, purchaseOrderController.getTotalPurchaseOrders);

// Get all purchase orders
router.get("/", purchaseOrderController.getAllPurchaseOrders);


// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An unexpected error occurred" });
});

module.exports = router;
