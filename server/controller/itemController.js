const Item = require('../models/item');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');

// Create a new item
const createItem = catchAsync(async (req, res) => {
  
  if (!mongoose.Types.ObjectId.isValid(req.body.supplier)) {
    throw new AppError('Invalid supplier ID', 400);
  }

  const item = await Item.create(req.body);
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
  const item = await Item.findByIdAndDelete(itemId);

  if (!item) {
    return next(new AppError(`No item found with id ${itemId}`, 404));
  }

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
