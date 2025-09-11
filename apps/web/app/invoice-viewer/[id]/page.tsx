"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InvoiceViewerLayout } from "@/components/invoice-viewer/InvoiceViewerLayout";
import { fetchInvoice } from "@/lib/api";
import { IInvoice } from "@/lib/types";
import { toast } from "sonner";

export default function InvoiceViewerPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadInvoice(params.id as string);
    }
  }, [params.id]);

  const loadInvoice = async (id: string) => {
    try {
      setLoading(true);
      const data = await fetchInvoice(id);
      setInvoice(data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
          <p className="text-gray-600">The invoice you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <InvoiceViewerLayout 
      invoice={invoice} 
      onInvoiceUpdate={setInvoice}
    />
  );
}
