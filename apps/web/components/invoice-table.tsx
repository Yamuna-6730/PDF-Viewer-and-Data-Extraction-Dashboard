"use client";

import Link from "next/link";
import { useState } from "react";
import { IInvoice } from "../lib/types";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { deleteInvoice } from "../lib/api";
import { toast } from "sonner";
import { Eye, Edit, Trash2 } from "lucide-react";

interface InvoiceTableProps {
  invoices: IInvoice[];
  onInvoiceDeleted?: () => void;
}

export default function InvoiceTable({ invoices, onInvoiceDeleted }: InvoiceTableProps) {
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const filtered = invoices.filter(
    (i) => i.vendor.name.toLowerCase().includes(query.toLowerCase()) ||
           i.invoice.number.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }
    
    setDeletingId(invoiceId);
    try {
      await deleteInvoice(invoiceId);
      toast.success('Invoice deleted successfully');
      onInvoiceDeleted?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number, currency = 'USD') => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No invoices found. Upload a PDF to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by Vendor or Invoice #"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Vendor</th>
              <th className="text-left p-3 font-medium">Invoice #</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Total</th>
              <th className="text-left p-3 font-medium">Created</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((invoice) => (
              <tr key={invoice._id} className="border-t hover:bg-muted/50">
                <td className="p-3">
                  <div>
                    <div className="font-medium">{invoice.vendor.name}</div>
                    {invoice.vendor.address && (
                      <div className="text-sm text-muted-foreground">
                        {invoice.vendor.address}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 font-mono">{invoice.invoice.number}</td>
                <td className="p-3">{formatDate(invoice.invoice.date)}</td>
                <td className="p-3">
                  {formatCurrency(invoice.invoice.total, invoice.invoice.currency)}
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {formatDate(invoice.createdAt)}
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInvoiceView?.(invoice._id!)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(invoice._id!)}
                      disabled={deletingId === invoice._id}
                    >
                      {deletingId === invoice._id ? (
                        <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      {deletingId === invoice._id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filtered.length === 0 && query && (
        <div className="text-center py-4 text-muted-foreground">
          <p>No invoices match your search for "{query}"</p>
        </div>
      )}
    </div>
  );
}
