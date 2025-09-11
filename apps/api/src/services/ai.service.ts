import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import pdfParse from 'pdf-parse';
import { getStorageService } from './fileStorage.service';
import { IVendor, IInvoiceData } from '../types/invoice.types';

export interface IAIExtractionResult {
  vendor: IVendor;
  invoice: IInvoiceData;
}

export interface IAIService {
  extractInvoiceData(fileId: string): Promise<IAIExtractionResult>;
}

// Base prompt for document data extraction
const EXTRACTION_PROMPT = `
Extract document data from the following text and return a valid JSON object with this exact structure:

{
  "vendor": {
    "name": "string (company/vendor name, or 'Unknown' if not found)",
    "address": "string (optional)",
    "taxId": "string (optional)"
  },
  "invoice": {
    "number": "string (invoice/document number, or 'N/A' if not found)",
    "date": "string in YYYY-MM-DD format (document date, or current date if not found)",
    "currency": "string (optional, default USD)",
    "subtotal": number (optional),
    "taxPercent": number (optional),
    "total": number (optional),
    "poNumber": "string (optional)",
    "poDate": "string in YYYY-MM-DD format (optional)",
    "lineItems": [
      {
        "description": "string (required)",
        "unitPrice": number (required),
        "quantity": number (required),
        "total": number (required)"
      }
    ]
  }
}

Rules:
1. This can be any type of document (invoice, receipt, bill, contract, etc.)
2. Extract any visible line items with their descriptions, unit prices, quantities, and totals
3. If dates are in different formats, convert them to YYYY-MM-DD
4. If dates are not found, use today's date: 2024-01-01
5. Extract numeric values without currency symbols or commas
6. If vendor name is not found, use 'Unknown Vendor'
7. If document number is not found, use 'DOC-' + random 4-digit number
8. Always provide defaults for required fields rather than leaving them null
9. Ensure the JSON is valid and parseable
10. Only return the JSON object, no additional text or explanations

Document text:
`;

class GeminiAIService implements IAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async extractInvoiceData(fileId: string): Promise<IAIExtractionResult> {
    try {
      // Download and parse PDF
      const pdfText = await this.extractTextFromPDF(fileId);
      
      // Create prompt with PDF text
      const prompt = EXTRACTION_PROMPT + pdfText;

      // Generate response
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const extractedText = response.text();

      // Parse JSON response
      return this.parseAIResponse(extractedText);
    } catch (error) {
      console.error('Gemini extraction error:', error);
      throw new Error(`Gemini AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextFromPDF(fileId: string): Promise<string> {
    const storageService = getStorageService();
    const pdfBuffer = await storageService.download(fileId);
    const pdfData = await pdfParse(pdfBuffer);
    return pdfData.text;
  }

  private parseAIResponse(response: string): IAIExtractionResult {
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Ensure basic structure exists
      if (!parsed.vendor) {
        parsed.vendor = {};
      }
      if (!parsed.invoice) {
        parsed.invoice = {};
      }

      // Provide defaults for required fields if missing or null
      if (!parsed.vendor.name || parsed.vendor.name === null) {
        parsed.vendor.name = 'Unknown Vendor';
      }
      if (!parsed.invoice.number || parsed.invoice.number === null) {
        parsed.invoice.number = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      if (!parsed.invoice.date || parsed.invoice.date === null) {
        parsed.invoice.date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
      }
      
      // Ensure optional fields have reasonable defaults
      if (!parsed.invoice.currency) {
        parsed.invoice.currency = 'USD';
      }

      // Ensure lineItems is an array
      if (!Array.isArray(parsed.invoice.lineItems)) {
        parsed.invoice.lineItems = [];
      }

      return parsed as IAIExtractionResult;
    } catch (error) {
      console.error('Failed to parse AI response:', response);
      
      // If parsing fails completely, return a safe default structure
      return {
        vendor: {
          name: 'Unknown Vendor',
          address: undefined,
          taxId: undefined
        },
        invoice: {
          number: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().split('T')[0],
          currency: 'USD',
          subtotal: undefined,
          taxPercent: undefined,
          total: undefined,
          poNumber: undefined,
          poDate: undefined,
          lineItems: []
        }
      };
    }
  }
}

class GroqAIService implements IAIService {
  private groq: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    
    this.groq = new Groq({ apiKey });
  }

  async extractInvoiceData(fileId: string): Promise<IAIExtractionResult> {
    try {
      // Download and parse PDF
      const pdfText = await this.extractTextFromPDF(fileId);
      
      // Create prompt with PDF text
      const prompt = EXTRACTION_PROMPT + pdfText;

      // Generate response
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.1-8b-instant', // or 'mixtral-8x7b-32768'
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 2048,
      });

      const extractedText = chatCompletion.choices[0]?.message?.content;
      
      if (!extractedText) {
        throw new Error('No response received from Groq');
      }

      // Parse JSON response
      return this.parseAIResponse(extractedText);
    } catch (error) {
      console.error('Groq extraction error:', error);
      throw new Error(`Groq AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextFromPDF(fileId: string): Promise<string> {
    const storageService = getStorageService();
    const pdfBuffer = await storageService.download(fileId);
    const pdfData = await pdfParse(pdfBuffer);
    return pdfData.text;
  }

  private parseAIResponse(response: string): IAIExtractionResult {
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Ensure basic structure exists
      if (!parsed.vendor) {
        parsed.vendor = {};
      }
      if (!parsed.invoice) {
        parsed.invoice = {};
      }

      // Provide defaults for required fields if missing or null
      if (!parsed.vendor.name || parsed.vendor.name === null) {
        parsed.vendor.name = 'Unknown Vendor';
      }
      if (!parsed.invoice.number || parsed.invoice.number === null) {
        parsed.invoice.number = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      if (!parsed.invoice.date || parsed.invoice.date === null) {
        parsed.invoice.date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
      }
      
      // Ensure optional fields have reasonable defaults
      if (!parsed.invoice.currency) {
        parsed.invoice.currency = 'USD';
      }

      // Ensure lineItems is an array
      if (!Array.isArray(parsed.invoice.lineItems)) {
        parsed.invoice.lineItems = [];
      }

      return parsed as IAIExtractionResult;
    } catch (error) {
      console.error('Failed to parse AI response:', response);
      
      // If parsing fails completely, return a safe default structure
      return {
        vendor: {
          name: 'Unknown Vendor',
          address: undefined,
          taxId: undefined
        },
        invoice: {
          number: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().split('T')[0],
          currency: 'USD',
          subtotal: undefined,
          taxPercent: undefined,
          total: undefined,
          poNumber: undefined,
          poDate: undefined,
          lineItems: []
        }
      };
    }
  }
}

// Factory function to get the appropriate AI service
export function getAIService(model: 'gemini' | 'groq'): IAIService {
  switch (model) {
    case 'gemini':
      return new GeminiAIService();
    case 'groq':
      return new GroqAIService();
    default:
      throw new Error(`Unsupported AI model: ${model}`);
  }
}

export { GeminiAIService, GroqAIService };
