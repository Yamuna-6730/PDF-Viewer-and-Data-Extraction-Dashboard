"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchInvoice, updateInvoice, deleteInvoice, getFileDownloadUrl } from "../../../lib/api";
import { IInvoice, IVendor, ILineItem } from "../../../lib/types";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Download, 
  Plus, 
  Minus,
  FileText,
  Building2,
  Receipt,
  DollarSign,
  Calendar,
  Loader2
} from "lucide-react";
import Link from "next/link";

export default function InvoiceViewerPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoice(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast.error('Failed to load invoice');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!invoice?._id) return;

    try {
      setSaving(true);
      await updateInvoice(invoice._id, {
        vendor: invoice.vendor,
        invoice: invoice.invoice,
        fileName: invoice.fileName
      });
      toast.success('Invoice updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice?._id) return;

    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteInvoice(invoice._id);
      toast.success('Invoice deleted successfully');
      router.push('/');
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!invoice?.fileId) return;
    const downloadUrl = getFileDownloadUrl(invoice.fileId);
    window.open(downloadUrl, '_blank');
  };

  const updateVendor = (field: keyof IVendor, value: string) => {
    if (!invoice) return;
    setInvoice({
      ...invoice,
      vendor: {
        ...invoice.vendor,
        [field]: value
      }
    });
  };

  const updateInvoiceData = (field: keyof IInvoice['invoice'], value: string | number) => {
    if (!invoice) return;
    setInvoice({
      ...invoice,
      invoice: {
        ...invoice.invoice,
        [field]: value
      }
    });
  };

  const updateLineItem = (index: number, field: keyof ILineItem, value: string | number) => {
    if (!invoice) return;
    const newLineItems = [...invoice.invoice.lineItems];
    const currentItem = newLineItems[index];
    
    if (!currentItem) return;
    
    // Update the specific field
    if (field === 'description') {
      currentItem[field] = value as string;
    } else {
      currentItem[field] = Number(value) || 0;
    }
    
    // Recalculate total for the line item
    if (field === 'unitPrice' || field === 'quantity') {
      currentItem.total = currentItem.unitPrice * currentItem.quantity;
    }
    
    setInvoice({
      ...invoice,
      invoice: {
        ...invoice.invoice,
        lineItems: newLineItems
      }
    });
  };

  const addLineItem = () => {
    if (!invoice) return;
    const newLineItem: ILineItem = {
      description: '',
      unitPrice: 0,
      quantity: 1,
      total: 0
    };
    setInvoice({
      ...invoice,
      invoice: {
        ...invoice.invoice,
        lineItems: [...invoice.invoice.lineItems, newLineItem]
      }
    });
  };

  const removeLineItem = (index: number) => {
    if (!invoice) return;
    const newLineItems = invoice.invoice.lineItems.filter((_, i) => i !== index);
    setInvoice({
      ...invoice,
      invoice: {
        ...invoice.invoice,
        lineItems: newLineItems
      }
    });
  };

  const calculateSubtotal = () => {
    if (!invoice) return 0;
    return invoice.invoice.lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = (subtotal: number) => {
    if (!invoice?.invoice.taxPercent) return 0;
    return (subtotal * invoice.invoice.taxPercent) / 100;
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
        <p className="text-muted-foreground mb-4">
          The invoice you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Invoice {invoice.invoice.number}</h1>
            <p className="text-muted-foreground">
              Created {formatDate(invoice.createdAt)}
              {invoice.updatedAt && ` • Updated ${formatDate(invoice.updatedAt)}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Edit Invoice
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
          
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vendor-name">Vendor Name</Label>
              <Input
                id="vendor-name"
                value={invoice.vendor.name}
                onChange={(e) => updateVendor('name', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="vendor-address">Address</Label>
              <Input
                id="vendor-address"
                value={invoice.vendor.address || ''}
                onChange={(e) => updateVendor('address', e.target.value)}
                disabled={!isEditing}
                placeholder="Vendor address"
              />
            </div>
            <div>
              <Label htmlFor="vendor-tax-id">Tax ID</Label>
              <Input
                id="vendor-tax-id"
                value={invoice.vendor.taxId || ''}
                onChange={(e) => updateVendor('taxId', e.target.value)}
                disabled={!isEditing}
                placeholder="Tax ID"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice-number">Invoice Number</Label>
                <Input
                  id="invoice-number"
                  value={invoice.invoice.number}
                  onChange={(e) => updateInvoiceData('number', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="invoice-date">Date</Label>
                <Input
                  id="invoice-date"
                  type="date"
                  value={invoice.invoice.date}
                  onChange={(e) => updateInvoiceData('date', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="po-number">PO Number</Label>
                <Input
                  id="po-number"
                  value={invoice.invoice.poNumber || ''}
                  onChange={(e) => updateInvoiceData('poNumber', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Purchase order number"
                />
              </div>
              <div>
                <Label htmlFor="po-date">PO Date</Label>
                <Input
                  id="po-date"
                  type="date"
                  value={invoice.invoice.poDate || ''}
                  onChange={(e) => updateInvoiceData('poDate', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={invoice.invoice.currency || 'USD'}
                  onChange={(e) => updateInvoiceData('currency', e.target.value)}
                  disabled={!isEditing}
                  placeholder="USD"
                />
              </div>
              <div>
                <Label htmlFor="tax-percent">Tax Percentage</Label>
                <Input
                  id="tax-percent"
                  type="number"
                  value={invoice.invoice.taxPercent || 0}
                  onChange={(e) => updateInvoiceData('taxPercent', parseFloat(e.target.value) || 0)}
                  disabled={!isEditing}
                  placeholder="0.00"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Line Items
            </div>
            {isEditing && (
              <Button onClick={addLineItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoice.invoice.lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                <div className="col-span-12 md:col-span-5">
                  <Label htmlFor={`item-desc-${index}`}>Description</Label>
                  <Input
                    id={`item-desc-${index}`}
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label htmlFor={`item-price-${index}`}>Unit Price</Label>
                  <Input
                    id={`item-price-${index}`}
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label htmlFor={`item-qty-${index}`}>Quantity</Label>
                  <Input
                    id={`item-qty-${index}`}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <Label>Total</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                    {formatCurrency(item.total, invoice.invoice.currency)}
                  </div>
                </div>
                {isEditing && (
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-6">
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal, invoice.invoice.currency)}
                  </span>
                </div>
                {invoice.invoice.taxPercent && invoice.invoice.taxPercent > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({invoice.invoice.taxPercent}%):</span>
                    <span className="font-medium">
                      {formatCurrency(tax, invoice.invoice.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(total, invoice.invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
