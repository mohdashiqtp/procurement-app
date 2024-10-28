const Item = require('../models/item');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');
const uploadToFileSystem = require('../utils/uploadToFileSystem'); 
const deleteFromFileSystem = require('../utils/deleteFromFileSystem'); 

//  helper functions 
const validateImageFile = (file) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (!file || typeof file !== 'object') {
    throw new AppError('Invalid file object received', 400);
  }

  const requiredProps = ['path', 'originalname', 'mimetype'];
  const missingProps = requiredProps.filter(prop => !file[prop]);
  
  if (missingProps.length > 0) {
    throw new AppError(`Missing required file properties: ${missingProps.join(', ')}`, 400);
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`, 400);
  }
};

const processImageFile = (file) => ({
  url: `/uploads/${file.filename}`,
  filename: file.filename,
  contentType: file.mimetype,
  size: file.size,
});

// Create a new item
const createItem = catchAsync(async (req, res) => {
  const itemImages = [];

  if (req.files?.length) {
    for (const file of req.files) {
      validateImageFile(file);
      itemImages.push(processImageFile(file));
    }
  }

  if (!mongoose.Types.ObjectId.isValid(req.body.supplier)) {
    throw new AppError('Invalid supplier ID', 400);
  }

  const item = await Item.create({ ...req.body, itemImages });
  res.status(201).json({ success: true, data: item });
});

// Get all items with pagination and filtering
const getAllItems = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sort = 'createdAt', name, minPrice, maxPrice } = req.query;
  const queryObject = {};

  if (name) queryObject.name = { $regex: name, $options: 'i' };
  if (minPrice) queryObject.price = { $gte: Number(minPrice) };
  if (maxPrice) queryObject.price = { ...queryObject.price, $lte: Number(maxPrice) };

  const items = await Item.find(queryObject)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('supplier', 'name');

  const totalItems = await Item.countDocuments(queryObject);

  res.status(200).json({
    success: true,
    data: items,
    currentPage: Number(page),
    totalPages: Math.ceil(totalItems / limit),
    totalItems,
  });
});

// Get a single item by ID
const getItem = catchAsync(async (req, res, next) => {
  const { id: itemId } = req.params;
  const item = await Item.findById(itemId).populate('supplier', 'name');
  
  if (!item) {
    return next(new AppError(`No item found with id ${itemId}`, 404));
  }
  
  res.status(200).json({ success: true, data: item });
});

// Update an item
const updateItem = catchAsync(async (req, res, next) => {
  const { id: itemId } = req.params;
  
  // Handle image updates
  if (req.files?.length) {
    const newImages = req.files.map(file => {
      validateImageFile(file);
      return processImageFile(file);
    });
    
    // Handle image deletions if specified
    if (req.body.imagesToDelete) {
      const imagesToDelete = JSON.parse(req.body.imagesToDelete);
      await Promise.all([
        ...imagesToDelete.map(filename => deleteFromFileSystem(filename)),
        Item.findByIdAndUpdate(itemId, {
          $pull: { itemImages: { filename: { $in: imagesToDelete } } }
        })
      ]);
    }
    
    await Item.findByIdAndUpdate(itemId, {
      $push: { itemImages: { $each: newImages } }
    });
  }

  const item = await Item.findByIdAndUpdate(
    itemId,
    { $set: req.body },
    { new: true, runValidators: true, context: 'query' }
  );

  if (!item) {
    return next(new AppError(`No item found with id ${itemId}`, 404));
  }

  res.status(200).json({ success: true, data: item });
});

// Delete an item
const deleteItem = catchAsync(async (req, res, next) => {
  const { id: itemId } = req.params;
  const item = await Item.findById(itemId);

  if (!item) {
    return next(new AppError(`No item found with id ${itemId}`, 404));
  }

  // Delete all associated images from filesystem
  if (item.itemImages && item.itemImages.length > 0) {
    for (const image of item.itemImages) {
      await deleteFromFileSystem(image.filename);
    }
  }

  await Item.findByIdAndDelete(itemId);

  res.status(200).json({ success: true, message: 'Item deleted successfully' });
});

// Bulk operations
const bulkOperations = catchAsync(async (req, res) => {
  const { operations } = req.body;
  const session = await Item.startSession();
  
  try {
    session.startTransaction();
    
    const results = await Promise.all(operations.map(async (op) => {
      switch (op.type) {
        case 'create':
          return Item.create([op.data], { session });
        case 'update':
          return Item.findByIdAndUpdate(op.id, op.data, { new: true, session });
        case 'delete':
          return Item.findByIdAndDelete(op.id, { session });
        default:
          throw new AppError(`Invalid operation type: ${op.type}`, 400);
      }
    }));

    await session.commitTransaction();
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

module.exports = {
  createItem,
  getAllItems,
  getItem,
  updateItem,
  deleteItem,
  bulkOperations,
};
