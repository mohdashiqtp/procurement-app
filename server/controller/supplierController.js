const Supplier = require("../models/supplier");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Create a new supplier
const createSupplier = catchAsync(async (req, res, next) => {
  const newSupplier = await Supplier.create(req.body);
  if (!newSupplier) {
    return next(new AppError('Failed to create supplier', 400));
  }
  res.status(201).json({
    status: "success",
    data: {
      supplier: newSupplier,
    },
  });
});

// Get all suppliers with pagination, filtering, and sorting
const getAllSuppliers = catchAsync(async (req, res, next) => {
  // Filtering
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let query = Supplier.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    query = query.select("-__v");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Execute query
  const suppliers = await query;

  // Send response
  res.status(200).json({
    status: "success",
    results: suppliers.length,
    data: {
      suppliers,
    },
  });
});

// Get a single supplier
const getSupplier = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return next(new AppError("No supplier found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      supplier,
    },
  });
});

// Update a supplier
const updateSupplier = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!supplier) {
    return next(new AppError("No supplier found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      supplier,
    },
  });
});

// Delete a supplier
const deleteSupplier = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findByIdAndDelete(req.params.id);

  if (!supplier) {
    return next(new AppError("No supplier found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Get suppliers by country
const getSuppliersByCountry = catchAsync(async (req, res, next) => {
  const suppliers = await Supplier.findByCountry(req.params.country);

  res.status(200).json({
    status: "success",
    results: suppliers.length,
    data: {
      suppliers,
    },
  });
});

// Activate a supplier
const activateSupplier = catchAsync(async (req, res, next) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return next(new AppError("No supplier found with that ID", 404));
  }

  try {
    await supplier.activate();
  } catch (error) {
    return next(new AppError("Failed to activate supplier", 500));
  }

  res.status(200).json({
    status: "success",
    data: {
      supplier,
    },
  });
});



module.exports = {
  activateSupplier,
  deleteSupplier,
  getSuppliersByCountry,
  updateSupplier,
  getSupplier,
  getAllSuppliers,
  createSupplier,
};
