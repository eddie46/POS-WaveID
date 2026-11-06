import React, { useState } from 'react';
import { Plus, Trash2, Building2, PackagePlus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CatalogItem,
  CompanyProfile,
  CurrencyCode,
  POLineItem,
  POStatus,
  PurchaseOrder,
  VendorPreset,
} from '../types/po';
import { calculatePOTotals, formatCurrency } from '../utils/formatters';

interface POEditorFormProps {
  po: PurchaseOrder;
  onChange: (updated: PurchaseOrder) => void;
  company: CompanyProfile;
  onCompanyChange: (updated: CompanyProfile) => void;
  vendors: VendorPreset[];
  catalog: CatalogItem[];
  onGenerateNextPONumber: () => void;
}

const STATUS_OPTIONS: POStatus[] = [
  'Draft',
  'Menunggu Persetujuan',
  'Disetujui',
  'Terkirim',
  'Selesai',
  'Dibatalkan',
];

const UNIT_OPTIONS = ['Unit', 'Pcs', 'Box', 'Set', 'Rim', 'Kg', 'Meter', 'Lisensi', 'Paket'];

const PAYMENT_TERMS_OPTIONS = [
  'Net 30 Hari',
  'Net 14 Hari',
  'Net 7 Hari',
  'COD / Tunai Saat Terima',
  'DP 50% - Pelunasan Saat Kirim',
  'CBD (Cash Before Delivery)',
];

export const POEditorForm: React.FC<POEditorFormProps> = ({
  po,
  onChange,
  company,
  onCompanyChange,
  vendors,
  catalog,
  onGenerateNextPONumber,
}) => {
  const [showCompanyEditor, setShowCompanyEditor] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');

  const totals = calculatePOTotals(po);

  const updateField = <K extends keyof PurchaseOrder>(key: K, value: PurchaseOrder[K]) => {
    onChange({
      ...po,
      [key]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSelectVendorPreset = (vendorId: string) => {
    const found = vendors.find((v) => v.id === vendorId);
    if (!found) return;
    onChange({
      ...po,
      vendorName: found.name,
      vendorContact: found.contactPerson,
      vendorPhone: found.phone,
      vendorEmail: found.email,
      vendorAddress: found.address,
      paymentTerms: found.paymentTermsDefault || po.paymentTerms,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddEmptyItem = () => {
    const newItem: POLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sku: `BRG-${String(po.items.length + 1).padStart(3, '0')}`,
      name: '',
      specification: '',
      quantity: 1,
      unit: 'Unit',
      unitPrice: 0,
    };
    updateField('items', [...po.items, newItem]);
  };

  const handleAddFromCatalog = (catalogId: string) => {
    const targetId = catalogId || selectedCatalogId;
    const found = catalog.find((c) => c.id === targetId);
    if (!found) return;

    const existingIdx = po.items.findIndex((i) => i.sku === found.sku && i.name === found.name);
    if (existingIdx >= 0) {
      const updatedItems = po.items.map((item, idx) =>
        idx === existingIdx ? { ...item, quantity: Number(item.quantity) + 1 } : item
      );
      updateField('items', updatedItems);
      return;
    }

    const newItem: POLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sku: found.sku,
      name: found.name,
      specification: found.specification,
      quantity: 1,
      unit: found.unit,
      unitPrice: found.defaultPrice,
    };
    updateField('items', [...po.items, newItem]);
  };

  const handleUpdateItem = <K extends keyof POLineItem>(
    itemId: string,
    key: K,
    value: POLineItem[K]
  ) => {
    const updatedItems = po.items.map((item) =>
      item.id === itemId ? { ...item, [key]: value } : item
    );
    updateField('items', updatedItems);
  };

  const handleRemoveItem = (itemId: string) => {
    updateField(
      'items',
      po.items.filter((item) => item.id !== itemId)
    );
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Informasi Dokumen PO */}
      <section className="bg-white border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900">01. Identitas Purchase Order</h2>
            <p className="text-xs text-slate-500">
              Nomor referensi dokumen, tanggal terbit, termin pembayaran, dan status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCompanyEditor((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Profil Perusahaan Pemesan</span>
            {showCompanyEditor ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Collapsible Buyer Company Profile */}
        {showCompanyEditor && (
          <div className="p-4 bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Data Perusahaan Anda (Otomatis tersimpan di browser)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => onCompanyChange({ ...company, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  NPWP Perusahaan
                </label>
                <input
                  type="text"
                  value={company.taxId}
                  onChange={(e) => onCompanyChange({ ...company, taxId: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => onCompanyChange({ ...company, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Kota & Kode Pos
                </label>
                <input
                  type="text"
                  value={company.city}
                  onChange={(e) => onCompanyChange({ ...company, city: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={company.phone}
                    onChange={(e) => onCompanyChange({ ...company, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) => onCompanyChange({ ...company, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Disiapkan Oleh
                  </label>
                  <input
                    type="text"
                    value={company.preparedBy}
                    onChange={(e) => onCompanyChange({ ...company, preparedBy: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Jabatan Pembuat
                  </label>
                  <input
                    type="text"
                    value={company.preparedRole}
                    onChange={(e) => onCompanyChange({ ...company, preparedRole: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Disetujui Oleh
                  </label>
                  <input
                    type="text"
                    value={company.approvedBy}
                    onChange={(e) => onCompanyChange({ ...company, approvedBy: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Jabatan Penyetuju
                  </label>
                  <input
                    type="text"
                    value={company.approvedRole}
                    onChange={(e) => onCompanyChange({ ...company, approvedRole: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nomor PO</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={po.poNumber}
                onChange={(e) => updateField('poNumber', e.target.value)}
                placeholder="PO-2026-1101"
                className="w-full px-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
              />
              <button
                type="button"
                onClick={onGenerateNextPONumber}
                title="Buat nomor urut otomatis"
                className="px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Terbit</label>
            <input
              type="date"
              value={po.issueDate}
              onChange={(e) => updateField('issueDate', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Pengiriman
            </label>
            <input
              type="date"
              value={po.deliveryDate}
              onChange={(e) => updateField('deliveryDate', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status PO</label>
            <select
              value={po.status}
              onChange={(e) => updateField('status', e.target.value as POStatus)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Termin Pembayaran
            </label>
            <input
              type="text"
              list="payment-terms-list"
              value={po.paymentTerms}
              onChange={(e) => updateField('paymentTerms', e.target.value)}
              placeholder="Ketik atau pilih termin"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
            <datalist id="payment-terms-list">
              {PAYMENT_TERMS_OPTIONS.map((term) => (
                <option key={term} value={term} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mata Uang</label>
            <select
              value={po.currency}
              onChange={(e) => updateField('currency', e.target.value as CurrencyCode)}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            >
              <option value="IDR">IDR (Rupiah - Rp)</option>
              <option value="USD">USD (US Dollar - $)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 2: Vendor / Supplier & Alamat Kirim */}
      <section className="bg-white border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900">02. Data Vendor & Tujuan Pengiriman</h2>
            <p className="text-xs text-slate-500">
              Pilih dari daftar vendor tersimpan atau ketik langsung informasi supplier.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleSelectVendorPreset(e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-300 text-slate-800 focus:outline-none focus:border-slate-900"
            >
              <option value="" disabled>
                Isi Cepat dari Daftar Vendor...
              </option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code} — {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Perusahaan Vendor / Supplier
            </label>
            <input
              type="text"
              value={po.vendorName}
              onChange={(e) => updateField('vendorName', e.target.value)}
              placeholder="Contoh: PT Mitra Teknologi Presisi"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Kontak PIC / Sales
            </label>
            <input
              type="text"
              value={po.vendorContact}
              onChange={(e) => updateField('vendorContact', e.target.value)}
              placeholder="Nama PIC Vendor"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Telepon Vendor</label>
            <input
              type="text"
              value={po.vendorPhone}
              onChange={(e) => updateField('vendorPhone', e.target.value)}
              placeholder="+62 21 ..."
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Vendor</label>
            <input
              type="email"
              value={po.vendorEmail}
              onChange={(e) => updateField('vendorEmail', e.target.value)}
              placeholder="sales@vendor.co.id"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Alamat Lengkap Vendor
            </label>
            <input
              type="text"
              value={po.vendorAddress}
              onChange={(e) => updateField('vendorAddress', e.target.value)}
              placeholder="Jl. ..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Ship-To Toggle */}
        <div className="pt-2 border-t border-slate-200 space-y-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={po.shipToSameAsCompany}
              onChange={(e) => updateField('shipToSameAsCompany', e.target.checked)}
              className="w-4 h-4 accent-slate-900"
            />
            <span>Alamat pengiriman sama dengan alamat profil perusahaan pemesan</span>
          </label>

          {!po.shipToSameAsCompany && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nama Lokasi / Gudang Tujuan
                </label>
                <input
                  type="text"
                  value={po.shipToName}
                  onChange={(e) => updateField('shipToName', e.target.value)}
                  placeholder="Gudang Cabang Bekasi"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Telepon Penerima
                </label>
                <input
                  type="text"
                  value={po.shipToPhone}
                  onChange={(e) => updateField('shipToPhone', e.target.value)}
                  placeholder="+62 ..."
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Alamat Pengiriman Lengkap
                </label>
                <input
                  type="text"
                  value={po.shipToAddress}
                  onChange={(e) => updateField('shipToAddress', e.target.value)}
                  placeholder="Jl. ..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Rincian Barang / Jasa */}
      <section className="bg-white border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900">03. Rincian Barang & Spesifikasi</h2>
            <p className="text-xs text-slate-500">
              Tambahkan baris barang dari katalog atau input manual. Semua angka dihitung otomatis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              <select
                value={selectedCatalogId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCatalogId(val);
                  if (val) {
                    handleAddFromCatalog(val);
                    setSelectedCatalogId('');
                  }
                }}
                className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-300 text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="">+ Tambah Cepat dari Katalog...</option>
                {catalog.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.sku} — {cat.name} ({formatCurrency(cat.defaultPrice, po.currency)})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddEmptyItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris Barang</span>
            </button>
          </div>
        </div>

        {/* High-Density Line Item Grid */}
        <div className="space-y-3">
          {po.items.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-300 bg-slate-50 space-y-2">
              <PackagePlus className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-medium text-slate-700">
                Belum ada item barang pada Purchase Order ini
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pilih barang dari menu dropdown katalog di atas atau klik tombol Tambah Baris Barang.
              </p>
              <button
                type="button"
                onClick={handleAddEmptyItem}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Barang Pertama</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                    <th className="py-2 px-2 w-8 text-center">#</th>
                    <th className="py-2 px-2 w-28">Kode SKU</th>
                    <th className="py-2 px-2 min-w-[200px]">Nama Barang & Spesifikasi</th>
                    <th className="py-2 px-2 w-20 text-right">Qty</th>
                    <th className="py-2 px-2 w-24">Satuan</th>
                    <th className="py-2 px-2 w-36 text-right">Harga Satuan</th>
                    <th className="py-2 px-2 w-36 text-right">Subtotal</th>
                    <th className="py-2 px-2 w-10 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {po.items.map((item, index) => {
                    const rowTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    return (
                      <tr key={item.id} className="align-top hover:bg-slate-50/70">
                        <td className="py-2.5 px-2 text-center font-mono text-slate-400 tabular-nums">
                          {index + 1}
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="text"
                            value={item.sku}
                            onChange={(e) => handleUpdateItem(item.id, 'sku', e.target.value)}
                            placeholder="SKU-001"
                            className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-1.5 space-y-1.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            placeholder="Nama barang / jasa..."
                            className="w-full px-2 py-1.5 text-xs font-medium bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                          />
                          <input
                            type="text"
                            value={item.specification}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'specification', e.target.value)
                            }
                            placeholder="Spesifikasi teknis / ukuran / catatan item (opsional)"
                            className="w-full px-2 py-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-slate-900"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'quantity', Math.max(0, Number(e.target.value)))
                            }
                            className="w-full px-2 py-1.5 text-xs font-mono text-right bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-1.5">
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-1.5">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'unitPrice',
                                Math.max(0, Number(e.target.value))
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs font-mono text-right bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatCurrency(rowTotal, po.currency)}
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Hapus baris"
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pajak, Diskon, Ongkir & Catatan */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
          <div className="sm:col-span-7">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catatan & Syarat Ketentuan PO
            </label>
            <textarea
              rows={4}
              value={po.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Contoh: Harap sertakan Surat Jalan dan Faktur Pajak saat pengiriman barang..."
              className="w-full p-3 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900 leading-relaxed"
            />
          </div>

          <div className="sm:col-span-5 space-y-3 bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Subtotal Barang</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {formatCurrency(totals.subtotal, po.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="text-slate-600">Diskon (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={po.discountPercent}
                  onChange={(e) =>
                    updateField('discountPercent', Math.max(0, Math.min(100, Number(e.target.value))))
                  }
                  className="w-20 px-2 py-1 text-right font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
                />
                <span className="font-mono text-slate-500 w-28 text-right tabular-nums">
                  - {formatCurrency(totals.discountAmount, po.currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="text-slate-600">PPN / Pajak (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={po.taxPercent}
                  onChange={(e) =>
                    updateField('taxPercent', Math.max(0, Number(e.target.value)))
                  }
                  className="w-20 px-2 py-1 text-right font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
                />
                <span className="font-mono text-slate-700 w-28 text-right tabular-nums">
                  + {formatCurrency(totals.taxAmount, po.currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="text-slate-600">Biaya Kirim</label>
              <input
                type="number"
                min={0}
                step="1000"
                value={po.shippingCost}
                onChange={(e) =>
                  updateField('shippingCost', Math.max(0, Number(e.target.value)))
                }
                className="w-36 px-2 py-1 text-right font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-300 text-sm font-bold text-slate-900">
              <span>Grand Total</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(totals.grandTotal, po.currency)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
