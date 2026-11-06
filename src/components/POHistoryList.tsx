import React, { useMemo, useState } from 'react';
import { Copy, FileSpreadsheet, FolderOpen, Plus, Search, Trash2 } from 'lucide-react';
import { POStatus, PurchaseOrder } from '../types/po';
import { calculatePOTotals, exportPOToCSV, formatCurrency, formatDateID } from '../utils/formatters';

interface POHistoryListProps {
  orders: PurchaseOrder[];
  activePOId: string;
  onSelectPO: (po: PurchaseOrder) => void;
  onCreateNewPO: () => void;
  onDuplicatePO: (po: PurchaseOrder) => void;
  onDeletePO: (id: string) => void;
  onStatusChange: (id: string, newStatus: POStatus) => void;
}

const FILTER_TABS: Array<{ label: string; value: 'ALL' | POStatus }> = [
  { label: 'Semua PO', value: 'ALL' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Menunggu Persetujuan', value: 'Menunggu Persetujuan' },
  { label: 'Disetujui', value: 'Disetujui' },
  { label: 'Terkirim', value: 'Terkirim' },
  { label: 'Selesai', value: 'Selesai' },
];

export const POHistoryList: React.FC<POHistoryListProps> = ({
  orders,
  activePOId,
  onSelectPO,
  onCreateNewPO,
  onDuplicatePO,
  onDeletePO,
  onStatusChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | POStatus>('ALL');

  const filteredOrders = useMemo(() => {
    return orders.filter((po) => {
      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesStatus;
      const inNumber = po.poNumber.toLowerCase().includes(q);
      const inVendor = po.vendorName.toLowerCase().includes(q);
      const inItems = po.items.some(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
      );
      return matchesStatus && (inNumber || inVendor || inItems);
    });
  }, [orders, searchQuery, statusFilter]);

  const summaryMetrics = useMemo(() => {
    let totalIDR = 0;
    let approvedCount = 0;
    let totalItemsOrdered = 0;

    orders.forEach((po) => {
      const totals = calculatePOTotals(po);
      if (po.currency === 'IDR' && po.status !== 'Dibatalkan') {
        totalIDR += totals.grandTotal;
      }
      if (po.status === 'Disetujui' || po.status === 'Selesai' || po.status === 'Terkirim') {
        approvedCount += 1;
      }
      totalItemsOrdered += totals.totalQuantity;
    });

    return {
      totalOrders: orders.length,
      totalIDR,
      approvedCount,
      totalItemsOrdered,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Top KPI Ledger Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 bg-white border border-slate-200 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <div className="text-xs text-slate-500">Total Dokumen PO</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {summaryMetrics.totalOrders}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span>{summaryMetrics.approvedCount} disetujui/selesai</span>
          </div>
        </div>

        <div className="p-5">
          <div className="text-xs text-slate-500">Nilai Akumulasi PO (IDR)</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatCurrency(summaryMetrics.totalIDR, 'IDR')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Tidak termasuk PO dibatalkan</div>
        </div>

        <div className="p-5">
          <div className="text-xs text-slate-500">Total Unit Barang Dipesan</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {summaryMetrics.totalItemsOrdered}
          </div>
          <div className="mt-1 text-xs text-slate-500">Akumulasi seluruh baris item</div>
        </div>

        <div className="p-5 flex flex-col justify-between">
          <div className="text-xs text-slate-500">Penyimpanan Statis</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            LocalStorage + JSON Backup
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={onCreateNewPO}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat PO Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Interactive Segmented Filter Controls */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100">
            {FILTER_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. PO, vendor, atau nama barang..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* High-Density Ledger Table */}
        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Nomor PO</th>
                <th className="py-3 px-4">Tanggal Terbit</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-4">Rincian Item</th>
                <th className="py-3 px-4">Status & Termin</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada dokumen Purchase Order yang sesuai dengan pencarian/filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => {
                  const totals = calculatePOTotals(po);
                  const isCurrent = po.id === activePOId;
                  return (
                    <tr
                      key={po.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-slate-50/90' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectPO(po)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {po.poNumber}
                        </button>
                        {isCurrent && (
                          <span className="ml-2 text-[11px] font-sans font-normal text-slate-500">
                            · Sedang dibuka
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateID(po.issueDate)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {po.vendorName || 'Belum diisi'}
                        </div>
                        <div className="text-slate-500">
                          <span>PIC: {po.vendorContact || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-mono tabular-nums font-medium text-slate-900">
                          {po.items.length} baris
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">{totals.totalQuantity} unit</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={po.status}
                            onChange={(e) => onStatusChange(po.id, e.target.value as POStatus)}
                            className="px-2 py-1 text-xs bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                            <option value="Disetujui">Disetujui</option>
                            <option value="Terkirim">Terkirim</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                          </select>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">{po.paymentTerms}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(totals.grandTotal, po.currency)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectPO(po)}
                            title="Buka & Edit di Workspace"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicatePO(po)}
                            title="Duplikat PO ini"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => exportPOToCSV(po)}
                            title="Unduh CSV"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePO(po.id)}
                            title="Hapus PO"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
