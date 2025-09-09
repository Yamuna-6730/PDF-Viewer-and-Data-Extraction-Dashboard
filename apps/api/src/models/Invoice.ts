import mongoose, { Schema, Document } from 'mongoose';
import { IInvoice, IVendor, ILineItem, IInvoiceData } from '../types/invoice.types';

// Extend the interfaces to include Document properties
interface IInvoiceDocument extends Omit<IInvoice, '_id'>, Document {}

// Vendor schema
const VendorSchema = new Schema<IVendor>({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true,
    maxlength: [200, 'Vendor name cannot exceed 200 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Vendor address cannot exceed 500 characters']
  },
  taxId: {
    type: String,
    trim: true,
    maxlength: [50, 'Tax ID cannot exceed 50 characters']
  }
}, { _id: false });

// Line item schema
const LineItemSchema = new Schema<ILineItem>({
  description: {
    type: String,
    required: [true, 'Line item description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Line item total is required'],
    min: [0, 'Total cannot be negative']
  }
}, { _id: false });

// Invoice data schema
const InvoiceDataSchema = new Schema<IInvoiceData>({
  number: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true,
    maxlength: [100, 'Invoice number cannot exceed 100 characters']
  },
  date: {
    type: String,
    required: [true, 'Invoice date is required'],
    trim: true
  },
  currency: {
    type: String,
    trim: true,
    maxlength: [10, 'Currency cannot exceed 10 characters'],
    default: 'USD'
  },
  subtotal: {
    type: Number,
    min: [0, 'Subtotal cannot be negative']
  },
  taxPercent: {
    type: Number,
    min: [0, 'Tax percent cannot be negative'],
    max: [100, 'Tax percent cannot exceed 100']
  },
  total: {
    type: Number,
    min: [0, 'Total cannot be negative']
  },
  poNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'PO number cannot exceed 100 characters']
  },
  poDate: {
    type: String,
    trim: true
  },
  lineItems: {
    type: [LineItemSchema],
    default: []
  }
}, { _id: false });

// Main Invoice schema
const InvoiceSchema = new Schema<IInvoiceDocument>({
  fileId: {
    type: String,
    required: [true, 'File ID is required'],
    trim: true,
    unique: true,
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  vendor: {
    type: VendorSchema,
    required: [true, 'Vendor information is required']
  },
  invoice: {
    type: InvoiceDataSchema,
    required: [true, 'Invoice data is required']
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  updatedAt: {
    type: String
  }
}, {
  timestamps: false, // We manage timestamps manually
  collection: 'invoices'
});

// Indexes for better query performance
InvoiceSchema.index({ 'vendor.name': 'text', 'invoice.number': 'text' });
InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ 'vendor.name': 1 });
InvoiceSchema.index({ 'invoice.number': 1 });

// Pre-save middleware to update the updatedAt field
InvoiceSchema.pre('save', function(this: IInvoiceDocument, next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date().toISOString();
  }
  next();
});

// Static methods
InvoiceSchema.statics.findBySearch = function(query: string, options: any = {}) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  
  let searchFilter = {};
  if (query) {
    searchFilter = {
      $or: [
        { 'vendor.name': { $regex: query, $options: 'i' } },
        { 'invoice.number': { $regex: query, $options: 'i' } }
      ]
    };
  }
  
  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(searchFilter)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Create and export the model
const Invoice = mongoose.model<IInvoiceDocument>('Invoice', InvoiceSchema);
export default Invoice;
