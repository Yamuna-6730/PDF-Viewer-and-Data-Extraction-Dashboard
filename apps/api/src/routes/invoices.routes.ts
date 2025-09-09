import express from 'express';
import Invoice from '../models/Invoice';
import { IApiResponse, IInvoice, ISearchQuery } from '../types/invoice.types';
import { validate, createInvoiceSchema, updateInvoiceSchema, searchQuerySchema } from '../utils/validation';

const router = express.Router();

/**
 * GET /invoices
 * Get all invoices with optional search and pagination
 */
router.get('/', 
  validate(searchQuerySchema, 'query'),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { q, page, limit, sortBy, sortOrder }: ISearchQuery = req.query;
      
      const skip = ((page || 1) - 1) * (limit || 10);
      let query = {};
      
      // Build search query
      if (q && q.trim()) {
        query = {
          $or: [
            { 'vendor.name': { $regex: q.trim(), $options: 'i' } },
            { 'invoice.number': { $regex: q.trim(), $options: 'i' } }
          ]
        };
      }

      // Build sort object
      const sort: any = {};
      const sortField = sortBy || 'createdAt';
      sort[sortField] = (sortOrder || 'desc') === 'desc' ? -1 : 1;

      // Execute queries
      const [invoices, total] = await Promise.all([
        Invoice.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit || 10)
          .lean(),
        Invoice.countDocuments(query)
      ]);

      const response: IApiResponse<IInvoice[]> = {
        success: true,
        data: invoices as unknown as IInvoice[],
        message: `Found ${invoices.length} invoice(s)`,
        pagination: {
          page: page || 1,
          limit: limit || 10,
          total,
          pages: Math.ceil(total / (limit || 10))
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Get invoices error:', error);
      const response: IApiResponse = {
        success: false,
        error: 'Failed to retrieve invoices'
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /invoices/:id
 * Get a specific invoice by ID
 */
router.get('/:id', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        error: 'Invalid invoice ID format'
      });
      return;
    }

    const invoice = await Invoice.findById(id).lean();

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    const response: IApiResponse<IInvoice> = {
      success: true,
      data: invoice as unknown as IInvoice,
      message: 'Invoice retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Get invoice error:', error);
    const response: IApiResponse = {
      success: false,
      error: 'Failed to retrieve invoice'
    };
    res.status(500).json(response);
  }
});

/**
 * POST /invoices
 * Create a new invoice
 */
router.post('/',
  validate(createInvoiceSchema),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const invoiceData = req.body;
      
      // Check if invoice with this fileId already exists
      const existingInvoice = await Invoice.findOne({ fileId: invoiceData.fileId });
      if (existingInvoice) {
        res.status(409).json({
          success: false,
          error: 'Invoice with this file ID already exists'
        });
        return;
      }

      // Add timestamps
      invoiceData.createdAt = new Date().toISOString();

      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();

      const response: IApiResponse<IInvoice> = {
        success: true,
        data: savedInvoice.toObject() as IInvoice,
        message: 'Invoice created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create invoice error:', error);
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        res.status(409).json({
          success: false,
          error: 'Invoice with this file ID already exists'
        });
        return;
      }

      const response: IApiResponse = {
        success: false,
        error: 'Failed to create invoice'
      };
      res.status(500).json(response);
    }
  }
);

/**
 * PUT /invoices/:id
 * Update an existing invoice
 */
router.put('/:id',
  validate(updateInvoiceSchema),
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({
          success: false,
          error: 'Invalid invoice ID format'
        });
        return;
      }

      // Add updated timestamp
      updateData.updatedAt = new Date().toISOString();

      const invoice = await Invoice.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, 
          runValidators: true,
          lean: true
        }
      );

      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
        return;
      }

      const response: IApiResponse<IInvoice> = {
        success: true,
        data: invoice as unknown as IInvoice,
        message: 'Invoice updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Update invoice error:', error);
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        res.status(409).json({
          success: false,
          error: 'Invoice with this file ID already exists'
        });
        return;
      }

      const response: IApiResponse = {
        success: false,
        error: 'Failed to update invoice'
      };
      res.status(500).json(response);
    }
  }
);

/**
 * DELETE /invoices/:id
 * Delete an invoice
 */
router.delete('/:id', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        error: 'Invalid invoice ID format'
      });
      return;
    }

    const invoice = await Invoice.findByIdAndDelete(id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'Invoice deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Delete invoice error:', error);
    const response: IApiResponse = {
      success: false,
      error: 'Failed to delete invoice'
    };
    res.status(500).json(response);
  }
});

export default router;
