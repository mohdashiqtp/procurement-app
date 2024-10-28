const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const STOCK_UNITS = Object.freeze({
  PCS: 'PCS',
  BOX: 'BOX',
  KG: 'KG',
  L: 'L',
});

const ITEM_STATUS = Object.freeze({
  ENABLED: 'Enabled',
  DISABLED: 'Disabled',
});

const itemSchema = new Schema({
  itemNo: {
    type: String,
    unique: true,
    required: true,
    immutable: true,
  },
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  inventoryLocation: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  stockUnit: {
    type: String,
    required: true,
    enum: Object.values(STOCK_UNITS),
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  itemImages: [{
    type: String,
    required: true,
  }],
  status: {
    type: String,
    enum: Object.values(ITEM_STATUS),
    default: ITEM_STATUS.ENABLED,
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

itemSchema.pre('save', async function generateItemNo(next) {
  if (!this.isNew) return next();

  const latestItem = await this.constructor.findOne({}, {}, { sort: { 'itemNo': -1 } });
  const lastItemNo = latestItem ? parseInt(latestItem.itemNo.slice(4)) : 0;
  this.itemNo = `ITEM${(lastItemNo + 1).toString().padStart(6, '0')}`;
  next();
});

const Item = model('Item', itemSchema);

module.exports = Item;
