const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const {
  createItem,
  getAllItems,
  getItem,
  updateItem,
  deleteItem,
  bulkOperations,
} = require("../controller/itemController");
const  authenticateUser  = require("../middlewares/auth");
const { validateRequest } = require("../utils/validation");

// Public routes
router.get("/", getAllItems);
router.get("/:id", getItem);

// Protected routes
router.use(authenticateUser);

// Create item
router.post("/", [
  body("itemName").notEmpty().withMessage("Item name is required"),
  body("inventoryLocation").notEmpty().withMessage("Inventory location is required"),
  body("brand").notEmpty().withMessage("Brand is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("supplier").notEmpty().withMessage("Supplier is required")
    .isMongoId().withMessage("Invalid supplier ID"),
  body("stockUnit").notEmpty().withMessage("Stock unit is required")
    .isIn(['PCS', 'KG', 'LITER', 'BOX', 'PACK']),
  body("unitPrice").isNumeric().withMessage("Unit price must be a number"),
  validateRequest
], createItem);

// Update item
router.put("/:id", [
  param("id").isMongoId().withMessage("Invalid item ID"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("description").optional().isString(),
  body("price").optional().isNumeric().withMessage("Price must be a number"),
  validateRequest
], updateItem);

// Delete item
router.delete("/:id", [
  param("id").isMongoId().withMessage("Invalid item ID"),
  validateRequest
], deleteItem);

// Bulk operations
router.post("/bulk", bulkOperations);

module.exports = router;
