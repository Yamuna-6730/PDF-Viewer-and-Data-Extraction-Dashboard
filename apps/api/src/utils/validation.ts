import Joi from 'joi';

// Vendor validation schema
const vendorSchema = Joi.object({
  name: Joi.string().required().trim().max(200),
  address: Joi.string().optional().trim().max(500),
  taxId: Joi.string().optional().trim().max(50)
});

// Line item validation schema
const lineItemSchema = Joi.object({
  description: Joi.string().required().trim().max(500),
  unitPrice: Joi.number().required().min(0),
  quantity: Joi.number().required().min(0),
  total: Joi.number().required().min(0)
});

// Invoice data validation schema
const invoiceDataSchema = Joi.object({
  number: Joi.string().required().trim().max(100),
  date: Joi.string().required().trim(),
  currency: Joi.string().optional().trim().max(10).default('USD'),
  subtotal: Joi.number().optional().min(0),
  taxPercent: Joi.number().optional().min(0).max(100),
  total: Joi.number().optional().min(0),
  poNumber: Joi.string().optional().trim().max(100),
  poDate: Joi.string().optional().trim(),
  lineItems: Joi.array().items(lineItemSchema).default([])
});

// Full invoice validation schema
export const createInvoiceSchema = Joi.object({
  fileId: Joi.string().required().trim(),
  fileName: Joi.string().required().trim().max(255),
  vendor: vendorSchema.required(),
  invoice: invoiceDataSchema.required()
});

// Update invoice validation schema (all fields optional except id)
export const updateInvoiceSchema = Joi.object({
  fileId: Joi.string().optional().trim(),
  fileName: Joi.string().optional().trim().max(255),
  vendor: vendorSchema.optional(),
  invoice: invoiceDataSchema.optional()
});

// Extract request validation schema
export const extractRequestSchema = Joi.object({
  fileId: Joi.string().required().trim(),
  model: Joi.string().valid('gemini', 'groq').required()
});

// Search query validation schema
export const searchQuerySchema = Joi.object({
  q: Joi.string().optional().trim().max(200),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'vendor.name', 'invoice.number').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// MongoDB ObjectId validation
export const mongoIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

// Validation middleware factory
export function validate(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: any, res: any, next: any): void => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      allowUnknown: property === 'query', // Allow unknown query params
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail: any) => detail.message);
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorMessages
      });
      return;
    }

    req[property] = value;
    next();
  };
}
