const PurchaseOrder = require("../models/purchaseOrder");
const Supplier = require("../models/supplier");
const Item = require("../models/item");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");

// Create a new purchase order
const createPurchaseOrder = catchAsync(async (req, res, next) => {
  const { supplierId, items, ...orderData } = req.body;

  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid supplier ID format. Please provide a valid MongoDB ObjectId'
    });
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    return next(new AppError("Supplier not found", 404));
  }

  const purchaseOrder = new PurchaseOrder({
    ...orderData,
    supplierName: supplier._id,
    supplierDisplayName: supplier.supplierName,
    items: await Promise.all(items.map(async (item) => {
      const foundItem = await Item.findById(item.itemId);
      if (!foundItem) {
        throw new AppError(`Item with id ${item.itemId} not found`, 404);
      }
      return {
        item: foundItem._id,
        packingUnit: item.packingUnit,
        orderQty: item.orderQty,
        unitPrice: item.unitPrice,
        itemAmount: item.itemAmount,
        discount: item.discount,
        netAmount: item.netAmount,
      };
    })),
  });

  const savedOrder = await purchaseOrder.save();
  res.status(200).json(savedOrder);
});

// Get purchase order by ID
const getPurchaseOrderById = catchAsync(async (req, res, next) => {
  const purchaseOrder = await PurchaseOrder.findById(req.params.id)
    .populate('supplierName', 'name')
    .populate('items.item', 'name price');
  if (!purchaseOrder) {
    return next(new AppError("Purchase order not found", 404));
  }
  res.json(purchaseOrder);
});

// Update purchase order
const updatePurchaseOrder = catchAsync(async (req, res, next) => {
  const { items, ...updateData } = req.body;
  const purchaseOrder = await PurchaseOrder.findById(req.params.id);

  if (!purchaseOrder) {
    return next(new AppError("Purchase order not found", 404));
  }

  Object.assign(purchaseOrder, updateData);

  if (items) {
    purchaseOrder.items = await Promise.all(items.map(async (item) => {
      const foundItem = await Item.findById(item.item);
      if (!foundItem) {
        throw new AppError(`Item with id ${item.item} not found`, 404);
      }
      return {
        item: foundItem._id,
        orderQty: item.orderQty,
        itemAmount: item.itemAmount,
        discount: item.discount,
        netAmount: item.netAmount,
      };
    }));
  }

  const updatedOrder = await purchaseOrder.save();
  res.json(updatedOrder);
});

// Delete purchase order
const deletePurchaseOrder = catchAsync(async (req, res, next) => {
  const purchaseOrder = await PurchaseOrder.findByIdAndDelete(req.params.id);
  if (!purchaseOrder) {
    return next(new AppError("Purchase order not found", 404));
  }
  res.json({ message: "Purchase order deleted successfully" });
});

// Get total of purchase orders
const getTotalPurchaseOrders = catchAsync(async (req, res, next) => {
  const result = await PurchaseOrder.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$netAmount" },
        count: { $sum: 1 }
      }
    }
  ]);

  const { totalAmount, count } = result[0] || { totalAmount: 0, count: 0 };
  res.json({ totalAmount, count });
});

// Get all purchase orders
const getAllPurchaseOrders = catchAsync(async (req, res, next) => {
  const purchaseOrders = await PurchaseOrder.find()
    .populate('supplierName', 'name')
    .populate('items.item', 'name price');
  
  res.json(purchaseOrders);
});

module.exports = {
  createPurchaseOrder,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getTotalPurchaseOrders,
  getAllPurchaseOrders
};
