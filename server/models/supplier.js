const mongoose = require('mongoose');
const validator = require('validator');

const supplierSchema = new mongoose.Schema({
  supplierNo: {
    type: String,
    unique: true,
    required: [true, 'Supplier number is required'],
  },
  supplierName: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    minlength: [2, 'Supplier name must be at least 2 characters long'],
    maxlength: [100, 'Supplier name cannot exceed 100 characters'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    enum: {
      values: [
        'United States',
        'United Kingdom',
        'Canada',
        'Australia',
        'Germany',
        'France',
        'Japan',
        'China',
        'India'
      ],
      message: '{VALUE} is not a supported country',
    },
  },
  taxNo: {
    type: String,
    required: [true, 'Tax number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return true;
      },
      message: props => `${props.value} is not a valid tax number!`
    },
  },
  mobileNo: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return validator.isMobilePhone(v);
      },
      message: props => `${props.value} is not a valid mobile number!`
    },
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: props => `${props.value} is not a valid email address!`
    },
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'Blocked'],
      message: '{VALUE} is not a valid status',
    },
    default: 'Active',
  },
}, {
  timestamps: true,
});

// Index for faster queries
supplierSchema.index({ supplierName: 1, country: 1 });

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  return `${this.address}, ${this.country}`;
});

// Pre-save hook for any additional logic
supplierSchema.pre('save', function(next) {
  next();
});

// Static method example
supplierSchema.statics.findByCountry = function(country) {
  return this.find({ 'address.country': country });
};

// Instance method example
supplierSchema.methods.activate = function() {
  this.status = 'Active';
  return this.save();
};

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
