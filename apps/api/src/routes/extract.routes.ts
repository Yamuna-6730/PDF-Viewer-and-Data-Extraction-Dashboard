import express from 'express';
import { getAIService } from '../services/ai.service';
import { IApiResponse, IExtractRequest, IInvoice } from '../types/invoice.types';
import { validate, extractRequestSchema } from '../utils/validation';

const router = express.Router();

/**
 * POST /extract
 * Body: { fileId: string, model: 'gemini' | 'groq' }
 * Returns extracted JSON data
 */
router.post('/',
  validate(extractRequestSchema),
  async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fileId, model }: IExtractRequest = req.body;

    if (!fileId || !model) {
      res.status(400).json({ success: false, error: 'fileId and model are required' });
      return;
    }

    const aiService = getAIService(model);
    const startTime = Date.now();

    // Extract data using selected model
    const extracted = await aiService.extractInvoiceData(fileId);

    const duration = Date.now() - startTime;

    // Prepare data to be saved/returned
    const data: Omit<IInvoice, '_id'> = {
      fileId,
      fileName: `${fileId}.pdf`,
      vendor: extracted.vendor,
      invoice: extracted.invoice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const response: IApiResponse = {
      success: true,
      data: {
        extractedData: data,
        processingTime: duration,
        model
      },
      message: 'Extraction successful'
    };

    res.json(response);
  } catch (error) {
    console.error('Extraction error:', error);
    const response: IApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed'
    };
    res.status(500).json(response);
  }
});

export default router;
