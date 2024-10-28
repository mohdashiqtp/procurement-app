const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const LineItemSchema = new Schema({
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  orderQty: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  itemAmount: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  netAmount: {
    type: Number,
    required: true,
  },
});

const PurchaseOrderSchema = new Schema(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    supplierName: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierDisplayName: {
      type: String,
      required: true,
      trim: true,
    },
    itemTotal: {
      type: Number,
      required: true,
      min: [0, 'Item total cannot be negative'],
    },
    discount: {
      type: Number,
      required: true,
      min: [0, 'Discount cannot be negative'],
    },
    netAmount: {
      type: Number,
      required: true,
      min: [0, 'Net amount cannot be negative'],
    },
    items: [LineItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for calculating the total number of items
PurchaseOrderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.orderQty, 0);
});

// Pre-save middleware to generate orderNo and calculate totals
PurchaseOrderSchema.pre('save', async function(next) {
  if (!this.orderNo) {
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'orderNo': -1 } });
    const lastOrderNo = lastOrder ? parseInt(lastOrder.orderNo.slice(2)) : 0;
    this.orderNo = `PO${(lastOrderNo + 1).toString().padStart(6, '0')}`;
  }

  this.itemTotal = this.items.reduce((total, item) => total + item.itemAmount, 0);
  this.discount = this.items.reduce((total, item) => total + item.discount, 0);
  this.netAmount = this.itemTotal - this.discount;

  next();
});

// Method to add a new item to the purchase order
PurchaseOrderSchema.methods.addItem = function(itemData) {
  this.items.push(itemData);
  return this.save();
};

// Static method to find purchase orders by supplier
PurchaseOrderSchema.statics.findBySupplier = function(supplierId) {
  return this.find({ supplierName: supplierId }).populate('supplierName items.item');
};

const PurchaseOrder = model('PurchaseOrder', PurchaseOrderSchema);

module.exports = PurchaseOrder;
