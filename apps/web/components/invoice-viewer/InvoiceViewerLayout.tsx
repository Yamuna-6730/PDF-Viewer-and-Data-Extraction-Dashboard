"use client";

import { IInvoice } from "@/lib/types";
import { PDFPreview } from "./PDFPreview";
import { InvoiceDetailsPanel } from "./InvoiceDetailsPanel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Calendar, DollarSign } from "lucide-react";

export function InvoiceViewerLayout({
  invoice,
  onInvoiceUpdate,
}: {
  invoice: IInvoice;
  onInvoiceUpdate: (inv: IInvoice) => void;
}) {
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="h-screen w-full bg-gray-100 flex">
      {/* Left sidebar with navigation icons */}
      <aside className="w-16 bg-white border-r flex flex-col items-center py-4 gap-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <User className="h-4 w-4 text-gray-400" />
        </div>
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <DollarSign className="h-4 w-4 text-gray-400" />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* PDF viewer section */}
        <section className="flex-1 bg-white border-r flex flex-col">
          {/* PDF header */}
          <div className="border-b bg-gray-50 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                  <FileText className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Documents</h3>
                </div>
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">PDF CONTROLS</div>
            </div>
          </div>
          
          {/* PDF content */}
          <div className="flex-1 overflow-auto">
            <PDFPreview fileId={invoice.fileId || ""} />
          </div>
        </section>

        {/* Right details panel */}
        <section className="w-96 bg-white">
          <InvoiceDetailsPanel invoice={invoice} onInvoiceUpdate={onInvoiceUpdate} />
        </section>
      </div>
    </div>
  );
}

