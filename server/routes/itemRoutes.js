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
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(new Error('No file uploaded'), false);
    }
    
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Not an image! Please upload only images.'), false);
    }
    
    cb(null, true);
  }
}).array('itemImages', 5);

const uploadMiddleware = (req, res, next) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum size is 5MB' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Maximum is 5 images' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (req.method === 'POST' && !req.files?.length) {
      return res.status(400).json({ error: 'At least one image is required' });
    }
    
    next();
  });
};

// Public routes
router.get("/", getAllItems);
router.get("/:id", getItem);

// Protected routes
router.use(authenticateUser);

// Create item
router.post("/", uploadMiddleware, [
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
router.put("/:id", uploadMiddleware, [
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
