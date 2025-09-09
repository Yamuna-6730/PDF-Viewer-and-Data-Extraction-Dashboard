"use client";

import { useState } from "react";
import { Invoice } from "../lib/types";
import { saveInvoice, deleteInvoice } from "../lib/api";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function InvoiceForm({ invoice }: { invoice: Invoice }) {
  const [data, setData] = useState(invoice);
  const [loading, setLoading] = useState(false);

  const handleChange = (path: string, value: string) => {
    const keys = path.split(".");
    const newData = { ...data };
    let obj: any = newData;
    keys.forEach((k, i) => {
      if (i === keys.length - 1) obj[k] = value;
      else obj = obj[k];
    });
    setData(newData);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveInvoice(data);
      toast.success("Invoice saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteInvoice(data.id);
      toast.success("Invoice deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-4 rounded space-y-4 border border-yellow-400">
      <h3 className="text-xl text-yellow-400 font-bold">Invoice Details</h3>
      <input
        className="w-full p-2 rounded border border-blue-500 text-black"
        value={data.vendor.name}
        onChange={(e) => handleChange("vendor.name", e.target.value)}
        placeholder="Vendor Name"
      />
      <input
        className="w-full p-2 rounded border border-blue-500 text-black"
        value={data.invoice.number}
        onChange={(e) => handleChange("invoice.number", e.target.value)}
        placeholder="Invoice Number"
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading}>Save</Button>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>Delete</Button>
      </div>
    </div>
  );
}
