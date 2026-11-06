import React from 'react';
import { CompanyProfile, PurchaseOrder } from '../types/po';
import { calculatePOTotals, formatCurrency, formatDateID, formatTerbilang } from '../utils/formatters';

interface PODocumentPreviewProps {
  po: PurchaseOrder;
  company: CompanyProfile;
}

export const PODocumentPreview: React.FC<PODocumentPreviewProps> = ({ po, company }) => {
  const totals = calculatePOTotals(po);

  const shipName = po.shipToSameAsCompany ? company.name : po.shipToName || company.name;
  const shipAddress = po.shipToSameAsCompany
    ? `${company.address}, ${company.city}`
    : po.shipToAddress || `${company.address}, ${company.city}`;
  const shipPhone = po.shipToSameAsCompany ? company.phone : po.shipToPhone || company.phone;

  return (
    <div className="print-only-sheet bg-white border border-slate-200 text-slate-900 p-6 sm:p-10 w-full max-w-[210mm] mx-auto">
      {/* Document Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-900">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-slate-500">
            Dokumen Pengadaan Resmi
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {company.name || 'Nama Perusahaan Pemesan'}
          </h1>
          <p className="text-xs text-slate-600 max-w-md leading-relaxed">
            {company.address}
            {company.city ? `, ${company.city}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 pt-1">
            <span>Telp: {company.phone || '-'}</span>
            <span aria-hidden="true">·</span>
            <span>Email: {company.email || '-'}</span>
            {company.taxId && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">NPWP: {company.taxId}</span>
              </>
            )}
          </div>
        </div>

        <div className="sm:text-right space-y-2 shrink-0">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            PURCHASE ORDER
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <div className="flex sm:justify-end items-center gap-2">
              <span className="text-slate-500">No. PO:</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {po.poNumber || 'PO-DRAFT'}
              </span>
            </div>
            <div className="flex sm:justify-end items-center gap-2">
              <span className="text-slate-500">Tanggal Terbit:</span>
              <span className="font-mono text-slate-900 tabular-nums">
                {formatDateID(po.issueDate)}
              </span>
            </div>
            <div className="flex sm:justify-end items-center gap-2">
              <span className="text-slate-500">Target Kirim:</span>
              <span className="font-mono text-slate-900 tabular-nums">
                {formatDateID(po.deliveryDate)}
              </span>
            </div>
            <div className="flex sm:justify-end items-center gap-2 pt-0.5">
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold text-slate-900">{po.status}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600">{po.paymentTerms || 'Net 30 Hari'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor & Ship-To Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">Kepada Yth. (Vendor / Supplier)</div>
          <div className="text-sm font-bold text-slate-900">
            {po.vendorName || 'Nama Vendor Belum Diisi'}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {po.vendorAddress || 'Alamat vendor belum diisi'}
          </p>
          <div className="text-xs text-slate-600 pt-1 space-y-0.5">
            <div>UP / Kontak: {po.vendorContact || '-'}</div>
            <div className="flex flex-wrap items-center gap-x-2 text-slate-500">
              <span className="font-mono tabular-nums">{po.vendorPhone || '-'}</span>
              {po.vendorEmail && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{po.vendorEmail}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500">Alamat Pengiriman (Ship To)</div>
          <div className="text-sm font-bold text-slate-900">{shipName}</div>
          <p className="text-xs text-slate-600 leading-relaxed">{shipAddress}</p>
          <div className="text-xs text-slate-600 pt-1 space-y-0.5">
            <div>Penerima: Bagian Logistik / Gudang</div>
            <div className="font-mono text-slate-500 tabular-nums">Telp: {shipPhone}</div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="py-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-900 text-xs font-semibold text-slate-700 bg-slate-50">
                <th className="py-2.5 px-2 w-10 text-center">No</th>
                <th className="py-2.5 px-2 w-28">Kode SKU</th>
                <th className="py-2.5 px-2">Deskripsi Barang & Spesifikasi</th>
                <th className="py-2.5 px-2 w-20 text-right">Qty</th>
                <th className="py-2.5 px-2 w-20">Satuan</th>
                <th className="py-2.5 px-2 w-32 text-right">Harga Satuan</th>
                <th className="py-2.5 px-2 w-36 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {po.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada baris barang pada Purchase Order ini.
                  </td>
                </tr>
              ) : (
                po.items.map((item, idx) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="py-3 px-2 text-center font-mono text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-700 tabular-nums">
                        {item.sku || '-'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-semibold text-slate-900">
                          {item.name || 'Nama barang belum diisi'}
                        </div>
                        {item.specification && (
                          <div className="text-slate-500 mt-0.5 leading-relaxed">
                            {item.specification}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-slate-600">{item.unit || 'Unit'}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700 tabular-nums">
                        {formatCurrency(item.unitPrice, po.currency)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(lineTotal, po.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terbilang & Summary Calculation */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2 pb-6 border-b border-slate-200">
        <div className="sm:col-span-7 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Terbilang:</div>
            <div className="text-xs font-semibold text-slate-900 italic mt-0.5 leading-relaxed">
              # {formatTerbilang(totals.grandTotal, po.currency)} #
            </div>
          </div>

          {po.notes && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700">
                Catatan & Syarat Pengadaan:
              </div>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                {po.notes}
              </pre>
            </div>
          )}
        </div>

        <div className="sm:col-span-5">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 text-slate-600">
              <span>Total Kuantitas</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {totals.totalQuantity} Item
              </span>
            </div>
            <div className="flex items-center justify-between py-1 text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {formatCurrency(totals.subtotal, po.currency)}
              </span>
            </div>
            {po.discountPercent > 0 && (
              <div className="flex items-center justify-between py-1 text-slate-600">
                <span>Diskon ({po.discountPercent}%)</span>
                <span className="font-mono tabular-nums text-slate-900">
                  - {formatCurrency(totals.discountAmount, po.currency)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-1 text-slate-600">
              <span>PPN / Pajak ({po.taxPercent}%)</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatCurrency(totals.taxAmount, po.currency)}
              </span>
            </div>
            {po.shippingCost > 0 && (
              <div className="flex items-center justify-between py-1 text-slate-600">
                <span>Biaya Pengiriman</span>
                <span className="font-mono tabular-nums text-slate-900">
                  {formatCurrency(totals.shipping, po.currency)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-900 text-sm font-bold text-slate-900">
              <span>GRAND TOTAL</span>
              <span className="font-mono tabular-nums text-base">
                {formatCurrency(totals.grandTotal, po.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-6 pt-8 text-xs text-center">
        <div className="flex flex-col justify-between min-h-[110px]">
          <div className="text-slate-500">Disiapkan Oleh,</div>
          <div className="pt-12">
            <div className="font-semibold text-slate-900 border-b border-slate-300 pb-1 inline-block min-w-[140px]">
              {company.preparedBy || '____________________'}
            </div>
            <div className="text-slate-500 mt-1">{company.preparedRole || 'Purchasing'}</div>
          </div>
        </div>

        <div className="flex flex-col justify-between min-h-[110px]">
          <div className="text-slate-500">Disetujui Oleh,</div>
          <div className="pt-12">
            <div className="font-semibold text-slate-900 border-b border-slate-300 pb-1 inline-block min-w-[140px]">
              {company.approvedBy || '____________________'}
            </div>
            <div className="text-slate-500 mt-1">{company.approvedRole || 'Manajer'}</div>
          </div>
        </div>

        <div className="flex flex-col justify-between min-h-[110px]">
          <div className="text-slate-500">Dikonfirmasi Vendor,</div>
          <div className="pt-12">
            <div className="font-semibold text-slate-900 border-b border-slate-300 pb-1 inline-block min-w-[140px]">
              {po.vendorContact || '____________________'}
            </div>
            <div className="text-slate-500 mt-1">{po.vendorName || 'Pihak Supplier'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
