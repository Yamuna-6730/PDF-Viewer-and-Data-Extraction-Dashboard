"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Check, X } from "lucide-react";

export interface LineItem {
  id: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vat: number;
  total: number;
}

export function EditableLineItemsTable({
  lineItems,
  onLineItemsChange,
}: {
  lineItems: LineItem[];
  onLineItemsChange: (lineItems: LineItem[]) => void | Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<LineItem> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sample data if no line items provided
  const sampleLineItems: LineItem[] = lineItems.length > 0 ? lineItems : [
    {
      id: "1",
      code: "H108744",
      description: "Nylon casing 60/35 Current Transformer for...",
      quantity: 1,
      unitPrice: 300,
      discount: 8,
      vat: 2,
      total: 2760.00
    },
    {
      id: "2", 
      code: "H108744",
      description: "Nylon casing 60/35 Current Transformer for...",
      quantity: 1,
      unitPrice: 300,
      discount: 8,
      vat: 2,
      total: 2760.00
    },
    {
      id: "3",
      code: "H108744", 
      description: "Nylon casing 60/35 Current Transformer for...",
      quantity: 1,
      unitPrice: 300,
      discount: 8,
      vat: 2,
      total: 2760.00
    },
    {
      id: "4",
      code: "H108744",
      description: "Nylon casing 60/35 Current Transformer for...", 
      quantity: 1,
      unitPrice: 300,
      discount: 8,
      vat: 2,
      total: 2760.00
    },
    {
      id: "5",
      code: "H108744",
      description: "Nylon casing 60/35 Current Transformer for...",
      quantity: 1, 
      unitPrice: 300,
      discount: 8,
      vat: 2,
      total: 2760.00
    }
  ];

  const handleAddNew = () => {
    setNewItem({
      id: Date.now().toString(),
      code: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      vat: 0,
      total: 0
    });
  };

  const handleSaveNew = async () => {
    if (newItem && newItem.description && newItem.unitPrice) {
      setIsLoading(true);
      try {
        const item: LineItem = {
          id: newItem.id || Date.now().toString(),
          code: newItem.code || "",
          description: newItem.description,
          quantity: newItem.quantity || 1,
          unitPrice: newItem.unitPrice,
          discount: newItem.discount || 0,
          vat: newItem.vat || 0,
          total: calculateTotal(newItem.quantity || 1, newItem.unitPrice, newItem.discount || 0, newItem.vat || 0)
        };
        await onLineItemsChange([...sampleLineItems, item]);
        setNewItem(null);
      } catch (error) {
        console.error("Failed to save new item:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancelNew = () => {
    setNewItem(null);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await onLineItemsChange(sampleLineItems.filter(item => item.id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = async (id: string, field: keyof LineItem, value: string | number) => {
    setIsLoading(true);
    try {
      const updatedItems = sampleLineItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate total if relevant fields change
          if (['quantity', 'unitPrice', 'discount', 'vat'].includes(field)) {
            updatedItem.total = calculateTotal(
              updatedItem.quantity,
              updatedItem.unitPrice,
              updatedItem.discount,
              updatedItem.vat
            );
          }
          return updatedItem;
        }
        return item;
      });
      await onLineItemsChange(updatedItems);
    } catch (error) {
      console.error("Failed to update item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoubleClick = (id: string, field: string) => {
    setEditingId(id);
    setEditingField(field);
  };

  const handleBlur = () => {
    setEditingId(null);
    setEditingField(null);
  };

  const calculateTotal = (quantity: number, unitPrice: number, discount: number, vat: number) => {
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = afterDiscount * (vat / 100);
    return afterDiscount + vatAmount;
  };

  return (
    <div className="space-y-3 relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Saving changes...</span>
          </div>
        </div>
      )}
      
      {/* Table Header */}
      <div className="grid grid-cols-8 gap-2 text-xs font-medium text-gray-600 bg-gray-100 p-2 rounded">
        <div>Code</div>
        <div className="col-span-2">Description</div>
        <div>Qty</div>
        <div>Unit Price</div>
        <div>Discount</div>
        <div>VAT</div>
        <div>Total</div>
      </div>

      {/* Existing Items */}
      {sampleLineItems.map((item, index) => (
        <div key={item.id} className="grid grid-cols-8 gap-2 text-xs bg-white border rounded p-2 items-center">
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded flex items-center justify-center text-[10px] font-medium">
              {index + 1}
            </span>
            <EditableCell
              value={item.code}
              isEditing={editingId === item.id && editingField === 'code'}
              onDoubleClick={() => handleDoubleClick(item.id, 'code')}
              onChange={(value) => handleFieldChange(item.id, 'code', value)}
              onBlur={handleBlur}
              className="text-blue-600"
            />
          </div>
          <div className="col-span-2">
            <EditableCell
              value={item.description}
              isEditing={editingId === item.id && editingField === 'description'}
              onDoubleClick={() => handleDoubleClick(item.id, 'description')}
              onChange={(value) => handleFieldChange(item.id, 'description', value)}
              onBlur={handleBlur}
              className="text-gray-900"
              multiline
            />
          </div>
          <EditableCell
            value={item.quantity}
            isEditing={editingId === item.id && editingField === 'quantity'}
            onDoubleClick={() => handleDoubleClick(item.id, 'quantity')}
            onChange={(value) => handleFieldChange(item.id, 'quantity', parseInt(value as string) || 1)}
            onBlur={handleBlur}
            type="number"
            formatter={(val) => val.toString().padStart(2, '0')}
          />
          <EditableCell
            value={item.unitPrice}
            isEditing={editingId === item.id && editingField === 'unitPrice'}
            onDoubleClick={() => handleDoubleClick(item.id, 'unitPrice')}
            onChange={(value) => handleFieldChange(item.id, 'unitPrice', parseFloat(value as string) || 0)}
            onBlur={handleBlur}
            type="number"
            formatter={(val) => `$ ${val}`}
          />
          <EditableCell
            value={item.discount}
            isEditing={editingId === item.id && editingField === 'discount'}
            onDoubleClick={() => handleDoubleClick(item.id, 'discount')}
            onChange={(value) => handleFieldChange(item.id, 'discount', parseFloat(value as string) || 0)}
            onBlur={handleBlur}
            type="number"
            formatter={(val) => `${val}%`}
          />
          <EditableCell
            value={item.vat}
            isEditing={editingId === item.id && editingField === 'vat'}
            onDoubleClick={() => handleDoubleClick(item.id, 'vat')}
            onChange={(value) => handleFieldChange(item.id, 'vat', parseFloat(value as string) || 0)}
            onBlur={handleBlur}
            type="number"
            formatter={(val) => `${val}%`}
          />
          <div className="flex items-center justify-between">
            <span className="font-medium">$ {item.total.toFixed(2)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(item.id)}
              disabled={isLoading}
              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      {/* New Item Row */}
      {newItem && (
        <div className="grid grid-cols-8 gap-2 text-xs bg-blue-50 border-2 border-blue-200 rounded p-2">
          <Input
            placeholder="Code"
            value={newItem.code || ""}
            onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
            className="text-xs h-8"
          />
          <Input
            placeholder="Description"
            value={newItem.description || ""}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="col-span-2 text-xs h-8"
          />
          <Input
            type="number"
            value={newItem.quantity || 1}
            onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
            className="text-xs h-8"
          />
          <Input
            type="number"
            value={newItem.unitPrice || 0}
            onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
            className="text-xs h-8"
          />
          <Input
            type="number"
            value={newItem.discount || 0}
            onChange={(e) => setNewItem({ ...newItem, discount: parseFloat(e.target.value) || 0 })}
            className="text-xs h-8"
          />
          <Input
            type="number"
            value={newItem.vat || 0}
            onChange={(e) => setNewItem({ ...newItem, vat: parseFloat(e.target.value) || 0 })}
            className="text-xs h-8"
          />
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveNew}
              disabled={isLoading}
              className="h-6 w-6 p-0 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelNew}
              disabled={isLoading}
              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Add New Button */}
      {!newItem && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddNew}
          disabled={isLoading}
          className="w-full border-dashed border-2 hover:bg-blue-50 hover:border-blue-300 text-blue-600 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Line Item
        </Button>
      )}

      {/* Toggle switch matching the design */}
      <div className="flex justify-end mt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Line Items</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked
            />
            <div className="w-9 h-5 bg-blue-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </div>
          <span className="text-xs font-medium text-blue-600">6</span>
        </div>
      </div>
    </div>
  );
}

// Editable Cell Component
function EditableCell({
  value,
  isEditing,
  onDoubleClick,
  onChange,
  onBlur,
  className = "",
  type = "text",
  multiline = false,
  formatter
}: {
  value: string | number;
  isEditing: boolean;
  onDoubleClick: () => void;
  onChange: (value: string | number) => void;
  onBlur: () => void;
  className?: string;
  type?: "text" | "number";
  multiline?: boolean;
  formatter?: (value: string | number) => string;
}) {
  const displayValue = formatter ? formatter(value) : value.toString();
  
  if (isEditing) {
    return (
      <Input
        type={type}
        defaultValue={value.toString()}
        onBlur={(e) => {
          const newValue = type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
          onChange(newValue);
          onBlur();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const newValue = type === "number" ? parseFloat(e.currentTarget.value) || 0 : e.currentTarget.value;
            onChange(newValue);
            onBlur();
          }
          if (e.key === 'Escape') {
            onBlur();
          }
        }}
        className="h-6 text-xs p-1 border-blue-400 focus:border-blue-500"
        autoFocus
      />
    );
  }

  return (
    <div
      className={`cursor-pointer hover:bg-gray-50 px-1 py-1 rounded ${className}`}
      onDoubleClick={onDoubleClick}
      title="Double click to edit"
    >
      {multiline && displayValue.length > 40 
        ? `${displayValue.substring(0, 40)}...` 
        : displayValue
      }
    </div>
  );
}
