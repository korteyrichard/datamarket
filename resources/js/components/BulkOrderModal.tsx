import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import axios from '@/lib/axios';
import * as XLSX from 'xlsx';

interface Product {
  id: number;
  name: string;
  quantity: string;
  network: string;
  price: number;
}

interface BulkOrderModalProps {
  products: Product[];
}

interface ParsedEntry {
  beneficiary_number: string;
  quantity: string;
  network: string;
}

const NETWORKS = ['MTN', 'TELECEL', 'AT Data (Instant)', 'AT (Big Packages)'];

export default function BulkOrderModal({ products }: BulkOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'excel'>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [isLoading, setIsLoading] = useState(false);
  const [fileEntries, setFileEntries] = useState<ParsedEntry[]>([]);
  const { toast } = useToast();

  const parseTextInput = (): ParsedEntry[] => {
    const lines = textInput.trim().split('\n').filter(l => l.trim());
    const entries: ParsedEntry[] = [];
    for (const line of lines) {
      const parts = line.trim().split(/[\s,;]+/);
      if (parts.length >= 2) {
        let phone = parts[0].replace(/\D/g, '');
        if (phone.length === 9) phone = '0' + phone;
        entries.push({
          beneficiary_number: phone,
          quantity: parts[1],
          network: selectedNetwork,
        });
      }
    }
    return entries;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileEntries([]);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const entries: ParsedEntry[] = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i].map(cell => String(cell ?? '').trim());
            if (i === 0 && (row[0].toLowerCase().includes('number') || row[0].toLowerCase().includes('phone') || row[0].toLowerCase().includes('beneficiary'))) {
              continue;
            }
            if (row.length >= 2 && row[0] && row[1]) {
              // Pad phone number with leading zero if needed (Excel strips it)
              let phone = row[0].replace(/\D/g, '');
              if (phone.length === 9) phone = '0' + phone;
              entries.push({
                beneficiary_number: phone,
                quantity: row[1],
                network: row[2] || selectedNetwork,
              });
            }
          }
          setFileEntries(entries);
        } catch (err) {
          toast({ description: 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.', variant: 'destructive', className: 'bg-red-500 text-white border-red-600' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const lines = text.trim().split('\n').filter(l => l.trim());
        const entries: ParsedEntry[] = [];

        for (let i = 0; i < lines.length; i++) {
          const parts = lines[i].trim().split(/[,;\t]+/).map(p => p.trim().replace(/"/g, ''));
          if (i === 0 && (parts[0].toLowerCase().includes('number') || parts[0].toLowerCase().includes('phone') || parts[0].toLowerCase().includes('beneficiary'))) {
            continue;
          }
          if (parts.length >= 2) {
            let phone = parts[0].replace(/\D/g, '');
            if (phone.length === 9) phone = '0' + phone;
            entries.push({
              beneficiary_number: phone,
              quantity: parts[1],
              network: parts[2] || selectedNetwork,
            });
          }
        }
        setFileEntries(entries);
      };
      reader.readAsText(file);
    }
  };

  const findProduct = (quantity: string, network: string): Product | undefined => {
    const q = quantity.trim();
    return products.find(p => {
      if (p.network !== network) return false;
      const pq = p.quantity.toLowerCase();
      const input = q.toLowerCase();
      // Match exact, or input without 'gb' suffix, or input with 'gb' appended
      return pq === input || pq === input + 'gb' || pq === input.replace(/gb$/i, '');
    });
  };

  const handleAddToCart = async () => {
    const entries = activeTab === 'text' ? parseTextInput() : fileEntries;

    if (entries.length === 0) {
      toast({ description: 'No valid entries found', variant: 'destructive', className: 'bg-red-500 text-white border-red-600' });
      return;
    }

    const errors: string[] = [];
    const validItems: { product_id: number; quantity: string; beneficiary_number: string }[] = [];

    for (const entry of entries) {
      if (!/^\d{10}$/.test(entry.beneficiary_number)) {
        errors.push(`${entry.beneficiary_number}: invalid phone number (must be 10 digits)`);
        continue;
      }
      const product = findProduct(entry.quantity, entry.network);
      if (!product) {
        errors.push(`${entry.beneficiary_number}: no product found for ${entry.quantity} on ${entry.network}`);
        continue;
      }
      validItems.push({
        product_id: product.id,
        quantity: product.quantity,
        beneficiary_number: entry.beneficiary_number,
      });
    }

    if (validItems.length === 0) {
      toast({ description: errors.join('\n'), variant: 'destructive', className: 'bg-red-500 text-white border-red-600' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/bulk-add-to-cart', { items: validItems });
      const data = response.data;

      if (data.added > 0) {
        toast({ description: `${data.added} item(s) added to cart successfully!` });
      }
      if (data.errors?.length > 0) {
        toast({ description: data.errors.join('; '), variant: 'destructive', className: 'bg-red-500 text-white border-red-600' });
      }
      if (errors.length > 0) {
        toast({ description: `Skipped: ${errors.join('; ')}`, variant: 'destructive', className: 'bg-red-500 text-white border-red-600' });
      }

      if (data.added > 0) {
        setTextInput('');
        setFileEntries([]);
        setIsOpen(false);
        router.reload();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.join('; ') || err.message || 'Failed to add items to cart';
      toast({ description: msg, variant: 'destructive', className: 'bg-red-500 text-white border-red-600' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-pink-500 hover:to-orange-500 shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bulk Orders
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Orders</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'text' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Bulk Orders (Text)
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'excel' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Bulk Orders (Excel/CSV)
          </button>
        </div>

        {/* Network Selector */}
        <div className="mb-4">
          <Label>Network</Label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm"
          >
            {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {activeTab === 'text' ? (
          <div className="space-y-3">
            <Label>Enter orders (one per line: phone_number quantity)</Label>
            <textarea
              className="w-full h-48 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm font-mono resize-none"
              placeholder={`0540000000 2GB\n0240000000 5GB\n0551234567 3GB`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Format: beneficiary_number quantity (space separated). e.g. "0540000000 2GB" or "0540000000 2". Quantity should match an available product data size for the selected network.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Label>Upload CSV or Excel file</Label>
            <input
              type="file"
              accept=".csv,.txt,.xls,.xlsx"
              onChange={handleFileUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500">
              CSV format: phone_number, quantity, network (optional). First row can be headers.
            </p>
            {fileEntries.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold mb-2">{fileEntries.length} entries parsed:</p>
                {fileEntries.slice(0, 10).map((entry, i) => (
                  <p key={i} className="text-xs text-gray-600 dark:text-gray-400">
                    {entry.beneficiary_number} → {entry.quantity} ({entry.network})
                  </p>
                ))}
                {fileEntries.length > 10 && (
                  <p className="text-xs text-gray-400 mt-1">... and {fileEntries.length - 10} more</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preview for text input */}
        {activeTab === 'text' && textInput.trim() && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-32 overflow-y-auto">
            <p className="text-xs font-semibold mb-1">Preview ({parseTextInput().length} entries):</p>
            {parseTextInput().slice(0, 5).map((entry, i) => (
              <p key={i} className="text-xs text-gray-600 dark:text-gray-400">
                {entry.beneficiary_number} → {entry.quantity} ({entry.network})
              </p>
            ))}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleAddToCart} disabled={isLoading}>
            {isLoading ? 'Adding to Cart...' : 'Add to Cart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
