"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchInvoices, checkApiHealth } from "../lib/api";
import InvoiceTable from "../components/invoice-table";
import { IInvoice, ISearchQuery } from "../lib/types";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { Upload, Search, RefreshCw, AlertCircle } from "lucide-react";

export default function HomePage() {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [apiHealthy, setApiHealthy] = useState(true);

  const loadInvoices = useCallback(async (searchParams?: ISearchQuery) => {
    try {
      setLoading(true);
      const result = await fetchInvoices(searchParams);
      setInvoices(result.invoices);
      setPagination(result.pagination);
      setApiHealthy(true);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices. Please check if the API server is running.');
      setApiHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    loadInvoices({ q: query || undefined, page: 1 });
  }, [loadInvoices]);

  const handleRefresh = () => {
    loadInvoices({ q: searchQuery || undefined });
  };

  const checkApiStatus = async () => {
    try {
      await checkApiHealth();
      setApiHealthy(true);
    } catch {
      setApiHealthy(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    checkApiStatus();
  }, [loadInvoices]);

  if (!apiHealthy) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">API Connection Failed</h2>
        <p className="text-muted-foreground mb-4">
          Unable to connect to the API server. Please make sure the backend is running on http://localhost:4000
        </p>
        <div className="space-x-2">
          <Button onClick={checkApiStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
          <Link href="/upload">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Invoice Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your PDF invoices with AI-powered data extraction
          </p>
        </div>
        <Link href="/upload">
          <Button className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            Upload PDF
          </Button>
        </Link>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by vendor name or invoice number..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {pagination && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{pagination.total}</div>
            <div className="text-sm text-muted-foreground">Total Invoices</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{pagination.page}</div>
            <div className="text-sm text-muted-foreground">Current Page</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{pagination.pages}</div>
            <div className="text-sm text-muted-foreground">Total Pages</div>
          </div>
        </div>
      )}

      {/* Invoice Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading invoices...</p>
        </div>
      ) : (
        <InvoiceTable 
          invoices={invoices} 
          onInvoiceDeleted={() => loadInvoices({ q: searchQuery || undefined })} 
        />
      )}
    </div>
  );
}
