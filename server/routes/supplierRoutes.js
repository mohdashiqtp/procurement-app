const express = require("express");
const router = express.Router();
const supplierController = require("../controller/supplierController");
const authMiddleware = require("../middlewares/auth");
const { body, param } = require("express-validator");
const {validateRequest} = require("../utils/validation")


// Input validation middleware
const createSupplierValidation = [
  body("supplierName").notEmpty().withMessage("Supplier name is required"),
];

const updateSupplierValidation = [
  body("name").optional().notEmpty().withMessage("Supplier name cannot be empty"),
];

// Group routes with common middleware
router.use(authMiddleware);

// Create a new supplier
router.post("/", createSupplierValidation, validateRequest, supplierController.createSupplier);

// Get all suppliers
router.get("/", supplierController.getAllSuppliers);

// Get supplier by ID
router.get("/:id", param("id").isMongoId(), validateRequest, supplierController.getSupplier);

// Update supplier
router.put("/:id", param("id").isMongoId(), updateSupplierValidation, validateRequest, supplierController.updateSupplier);

// Delete supplier
router.delete("/:id", param("id").isMongoId(), validateRequest, supplierController.deleteSupplier);

// Get suppliers by country
router.get("/country/:country", supplierController.getSuppliersByCountry);

// Activate supplier
router.patch("/:id/activate", param("id").isMongoId(), validateRequest, supplierController.activateSupplier);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An unexpected error occurred" });
});

module.exports = router;
