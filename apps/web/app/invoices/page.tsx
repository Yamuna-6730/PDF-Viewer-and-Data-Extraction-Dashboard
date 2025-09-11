"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  FileText, 
  Search, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchInvoices, deleteInvoice, getFileDownloadUrl } from '../../lib/api';
import type { IInvoice } from '../../lib/types';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadInvoices = async (search?: string, page = 1) => {
    try {
      setIsLoading(true);
      const { invoices: fetchedInvoices, pagination } = await fetchInvoices({
        q: search,
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      setInvoices(fetchedInvoices);
      if (pagination) {
        setTotalPages(pagination.pages);
        setCurrentPage(pagination.page);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadInvoices(searchQuery, 1);
  };

  const handleRefresh = () => {
    loadInvoices(searchQuery, currentPage);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(id);
      await deleteInvoice(id);
      setInvoices(prev => prev.filter(invoice => invoice._id !== id));
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadInvoices(searchQuery, page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getStatusBadge = (invoice: IInvoice) => {
    const status = (invoice as any).status || 'pending';
    const colorClasses = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[status as keyof typeof colorClasses] || colorClasses.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
              <p className="text-gray-600 mt-2">
                View and manage all your processed invoices.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => router.push('/upload')}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex space-x-2 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by invoice number, vendor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              Search
            </Button>
          </form>
        </div>

        {/* Invoice Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              All Invoices ({invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && invoices.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading invoices...</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Start by uploading your first invoice.'}
                </p>
                <Button onClick={() => router.push('/upload')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Invoice
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Invoice</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Vendor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {invoice.invoice.number || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.fileName}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {invoice.vendor.name || 'Unknown Vendor'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.vendor.taxId}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(invoice.invoice.total || 0, invoice.invoice.currency)}
                          </div>
                          {invoice.invoice.subtotal !== invoice.invoice.total && (
                            <div className="text-sm text-gray-500">
                              Subtotal: {formatCurrency(invoice.invoice.subtotal || 0, invoice.invoice.currency)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-900">
                            {invoice.invoice.date ? new Date(invoice.invoice.date).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(invoice)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-500">
                            {formatDate(invoice.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/?id=${invoice._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/invoice-viewer/${invoice._id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={getFileDownloadUrl(invoice.fileId)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInvoice(invoice._id!)}
                              disabled={isDeleting === invoice._id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isDeleting === invoice._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
