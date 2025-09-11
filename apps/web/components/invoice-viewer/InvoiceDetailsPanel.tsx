"use client";

import { useState } from "react";
import { IInvoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Plus, Trash2, Check, Search, Bot, X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";
import { EditableLineItemsTable } from "./EditableLineItemsTable";
import { extractInvoice, updateInvoice } from "@/lib/api";
import { toast } from "sonner";

export function InvoiceDetailsPanel({
  invoice,
  onInvoiceUpdate,
}: {
  invoice: IInvoice;
  onInvoiceUpdate: (invoice: IInvoice) => void;
}) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    customerInfo: true,
    customerCode: false,
    invoice: true,
    summary: true,
    lineItems: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExtractWithAI = async () => {
    if (!invoice.fileId) {
      toast.error("No file ID available for extraction");
      return;
    }

    setIsExtracting(true);
    try {
      const result = await extractInvoice(invoice.fileId, "gemini");
      onInvoiceUpdate({
        ...invoice,
        ...result.extractedData
      });
      toast.success("Invoice data extracted successfully!");
    } catch (error) {
      console.error("Extract error:", error);
      toast.error("Failed to extract invoice data");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApprove = () => {
    // TODO: Implement approve functionality
    toast.success("Invoice approved successfully!");
    console.log("Approve invoice:", invoice._id);
  };

  const handleFieldChange = async (field: string, value: string, nestedField?: string) => {
    const updatedInvoice = { ...invoice };
    
    if (nestedField) {
      // Handle nested fields like vendor.name, invoice.number, etc.
      if (field === 'vendor') {
        updatedInvoice.vendor = { ...updatedInvoice.vendor, [nestedField]: value };
      } else if (field === 'invoice') {
        updatedInvoice.invoice = { ...updatedInvoice.invoice, [nestedField]: value };
      }
    }
    
    // Update local state immediately for responsiveness
    onInvoiceUpdate(updatedInvoice);
    
    // Save to backend
    try {
      if (updatedInvoice._id) {
        await updateInvoice(updatedInvoice._id, {
          vendor: updatedInvoice.vendor,
          invoice: updatedInvoice.invoice,
          lineItems: updatedInvoice.lineItems
        });
      }
    } catch (error) {
      console.error("Failed to save invoice:", error);
      toast.error("Failed to save changes");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with user info and controls */}
      <div className="bg-white border-b">
        {/* Top bar with user and approve button */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-medium text-sm">AJ</span>
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">Amit Jadhav</p>
              <p className="text-xs text-gray-500">Admin/Documents/Details</p>
            </div>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
            onClick={handleApprove}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
        </div>

        {/* Document info and status */}
        <div className="px-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-600 rounded"></div>
                </div>
                <h2 className="font-medium text-sm text-gray-900">{invoice.fileName || "4470-Newtek Electricals.pdf"}</h2>
              </div>
              <p className="text-xs text-gray-500 ml-6">someemail@email.com</p>
            </div>
            <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 text-xs border-yellow-200 ml-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5"></span>
              Needs Review
            </Badge>
          </div>
        </div>

        {/* PDF Controls Bar */}
        <div className="border-t bg-gray-50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">PDF CONTROLS</div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Search className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <RotateCw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <X className="h-3 w-3" />
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white ml-2"
                onClick={handleExtractWithAI}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                  <Bot className="h-3 w-3 mr-1" />
                )}
                {isExtracting ? "Extracting..." : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content with form sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Customer Information */}
        <CollapsibleSection
          title="Customer Information"
          expanded={expandedSections.customerInfo}
          onToggle={() => toggleSection('customerInfo')}
          className="border-0 border-b"
        >
          <div className="space-y-4 p-4">
            <EditableFormField 
              label="Customer Name" 
              value={invoice.vendor?.name || "Firma Mustermann GmbH"} 
              onChange={(value) => handleFieldChange('vendor', value, 'name')}
            />
            <EditableFormField 
              label="Address" 
              value={"Richard Sanchez"} 
            />
            <EditableFormField 
              label="Vendor Address" 
              value={invoice.vendor?.address || "215 E Tasman Dr, PO Box 65007 CA 95134 San Jose"} 
              onChange={(value) => handleFieldChange('vendor', value, 'address')}
            />
            <EditableFormField 
              label="Postal Code" 
              value={"478392"} 
            />
          </div>
        </CollapsibleSection>

        {/* Customer Code */}
        <CollapsibleSection
          title="Customer Code"
          expanded={expandedSections.customerCode}
          onToggle={() => toggleSection('customerCode')}
          className="border-0 border-b"
        >
          <div className="space-y-4 p-4">
            <EditableFormField 
              label="Customer Name" 
              value={"Amit Shah"} 
            />
          </div>
        </CollapsibleSection>

        {/* Invoice */}
        <CollapsibleSection
          title="Invoice"
          expanded={expandedSections.invoice}
          onToggle={() => toggleSection('invoice')}
          className="border-0 border-b"
        >
          <div className="grid grid-cols-2 gap-4 p-4">
            <EditableFormField 
              label="PO Number" 
              value={invoice.invoice?.poNumber || "90038195"} 
              onChange={(value) => handleFieldChange('invoice', value, 'poNumber')}
            />
            <EditableFormField 
              label="PO Date" 
              value={invoice.invoice?.poDate || "31.10.2009"} 
              onChange={(value) => handleFieldChange('invoice', value, 'poDate')}
            />
          </div>
        </CollapsibleSection>

        {/* Summary */}
        <CollapsibleSection
          title="Summary"
          expanded={expandedSections.summary}
          onToggle={() => toggleSection('summary')}
          className="border-0 border-b"
        >
          <div className="space-y-4 p-4">
            <EditableFormField 
              label="Document Type" 
              value={"Rechnung"} 
            />
            <EditableFormField 
              label="Currency Short Form" 
              value={`${invoice.invoice?.currency || "€"} EUR - Euro`} 
            />
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <EditableFormField 
                label="Sub Total" 
                value={`€ ${invoice.invoice?.subtotal || 400}`} 
                className="font-semibold text-red-700"
              />
            </div>
            <EditableFormField 
              label="Locale" 
              value={"DE"} 
            />
          </div>
        </CollapsibleSection>

        {/* Line Items */}
        <CollapsibleSection
          title="Line Items"
          expanded={expandedSections.lineItems}
          onToggle={() => toggleSection('lineItems')}
          badge="6"
          className="border-0"
        >
          <div className="p-4">
            <EditableLineItemsTable
              lineItems={invoice.lineItems || []}
              onLineItemsChange={async (lineItems) => {
                const updatedInvoice = { ...invoice, lineItems };
                
                // Update local state immediately
                onInvoiceUpdate(updatedInvoice);
                
                // Save to backend
                try {
                  if (updatedInvoice._id) {
                    await updateInvoice(updatedInvoice._id, {
                      vendor: updatedInvoice.vendor,
                      invoice: updatedInvoice.invoice,
                      lineItems: updatedInvoice.lineItems
                    });
                  }
                } catch (error) {
                  console.error("Failed to save line items:", error);
                  toast.error("Failed to save line item changes");
                }
              }}
            />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

// Collapsible section component
function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
  badge,
  className = ""
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white ${className}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900">{title}</span>
          {badge && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="border-t bg-gray-50">{children}</div>
      )}
    </div>
  );
}

// Editable form field component
function EditableFormField({ 
  label, 
  value, 
  className = "",
  onChange 
}: { 
  label: string; 
  value: string; 
  className?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">{label}</label>
      {onChange ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${className}`}
        />
      ) : (
        <div className={`text-sm text-gray-900 px-3 py-2 bg-white border border-gray-200 rounded-md min-h-[36px] flex items-center ${className}`}>
          {value}
        </div>
      )}
    </div>
  );
}
