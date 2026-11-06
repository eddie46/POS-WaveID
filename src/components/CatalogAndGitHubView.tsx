import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { CatalogItem, CompanyProfile, PurchaseOrder, VendorPreset } from '../types/po';
import { formatCurrency } from '../utils/formatters';

interface CatalogAndGitHubViewProps {
  mode: 'catalog' | 'github';
  vendors: VendorPreset[];
  onChangeVendors: (vendors: VendorPreset[]) => void;
  catalog: CatalogItem[];
  onChangeCatalog: (catalog: CatalogItem[]) => void;
  orders: PurchaseOrder[];
  company: CompanyProfile;
  onImportDatabase: (payload: {
    orders?: PurchaseOrder[];
    vendors?: VendorPreset[];
    catalog?: CatalogItem[];
    company?: CompanyProfile;
  }) => void;
  onResetDefaultData: () => void;
}

const GITHUB_WORKFLOW_YAML = `name: Deploy Purchase Order Web ke GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build_and_deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build static web bundle
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

export const CatalogAndGitHubView: React.FC<CatalogAndGitHubViewProps> = ({
  mode,
  vendors,
  onChangeVendors,
  catalog,
  onChangeCatalog,
  orders,
  company,
  onImportDatabase,
  onResetDefaultData,
}) => {
  // New Catalog Item State
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [newUnit, setNewUnit] = useState('Unit');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newCategory, setNewCategory] = useState('Umum');

  // New Vendor State
  const [vCode, setVCode] = useState('');
  const [vName, setVName] = useState('');
  const [vContact, setVContact] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vAddress, setVAddress] = useState('');
  const [vTerms, setVTerms] = useState('Net 30 Hari');

  const [copiedYaml, setCopiedYaml] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const item: CatalogItem = {
      id: `cat-${Date.now()}`,
      sku: newSku.trim() || `SKU-${String(catalog.length + 1).padStart(3, '0')}`,
      name: newName.trim(),
      specification: newSpec.trim(),
      unit: newUnit,
      defaultPrice: Math.max(0, Number(newPrice) || 0),
      category: newCategory.trim() || 'Umum',
    };
    onChangeCatalog([item, ...catalog]);
    setNewSku('');
    setNewName('');
    setNewSpec('');
    setNewPrice(0);
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) return;
    const vendor: VendorPreset = {
      id: `vnd-${Date.now()}`,
      code: vCode.trim() || `VND-${String(vendors.length + 1).padStart(3, '0')}`,
      name: vName.trim(),
      contactPerson: vContact.trim(),
      phone: vPhone.trim(),
      email: vEmail.trim(),
      address: vAddress.trim(),
      paymentTermsDefault: vTerms.trim() || 'Net 30 Hari',
    };
    onChangeVendors([vendor, ...vendors]);
    setVCode('');
    setVName('');
    setVContact('');
    setVPhone('');
    setVEmail('');
    setVAddress('');
  };

  const handleExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      company,
      orders,
      vendors,
      catalog,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `database-po-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        onImportDatabase(parsed);
        setImportStatus('Data JSON berhasil dimuat ke dalam aplikasi.');
        setTimeout(() => setImportStatus(null), 4000);
      } catch {
        setImportStatus('Gagal membaca file JSON. Pastikan format file valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(GITHUB_WORKFLOW_YAML);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2500);
  };

  if (mode === 'github') {
    return (
      <div className="space-y-6">
        {/* Backup & Restore JSON Section */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Manajemen Data Statis (JSON Backup & Restore)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Karena GitHub Pages berjalan tanpa database server (serverless static web), seluruh
                data PO disimpan di browser Anda dan dapat diekspor ke file JSON kapan saja.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Database (.json)</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Impor File JSON</span>
              </button>

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data Contoh</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDefaultData();
                      setConfirmReset(false);
                    }}
                    className="px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Ya, Reset Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>

          {importStatus && (
            <div className="p-3 bg-slate-100 border border-slate-300 text-xs font-medium text-slate-900">
              {importStatus}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900">1. Tanpa Biaya Server (0 Rupiah)</div>
              <p className="text-slate-600 leading-relaxed">
                Aplikasi ini murni berjalan di sisi klien (React + Vite Static Bundle). Cocok
                di-hosting gratis di GitHub Pages, Vercel, atau Netlify.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900">2. Cetak A4 & Simpan PDF Presisi</div>
              <p className="text-slate-600 leading-relaxed">
                Saat menekan tombol Cetak / PDF, seluruh menu navigasi otomatis disembunyikan dan
                hanya lembar Purchase Order ukuran A4 yang dicetak.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900">3. Kolaborasi via File JSON / Git</div>
              <p className="text-slate-600 leading-relaxed">
                Tim purchasing dapat membagikan file ekspor JSON atau menyimpannya langsung di
                dalam repository GitHub perusahaan.
              </p>
            </div>
          </div>
        </section>

        {/* GitHub Pages Deployment Guide */}
        <section className="bg-white border border-slate-200 p-6 space-y-5">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              Panduan Deploy Otomatis ke GitHub Pages
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ikuti 3 langkah singkat berikut untuk mempublikasikan aplikasi Purchase Order ini di
              akun GitHub Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="font-bold text-slate-900">
                  Langkah 1 — Push Kode ke Repository GitHub
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Buat repository baru di GitHub (misalnya <code className="font-mono text-slate-900">purchase-order-web</code>), lalu unggah seluruh file proyek ini ke branch <code className="font-mono text-slate-900">main</code>.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-900">
                  Langkah 2 — Aktifkan GitHub Actions Pages
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Buka menu <strong>Settings &rarr; Pages</strong> di repository GitHub Anda. Pada
                  bagian <strong>Build and deployment &rarr; Source</strong>, pilih{' '}
                  <strong>GitHub Actions</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-900">
                  Langkah 3 — Tambahkan File Workflow Deploy
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Buat file bernama{' '}
                  <code className="font-mono text-slate-900">.github/workflows/deploy.yml</code> di
                  repository Anda dan tempelkan konfigurasi di sebelah kanan. Setiap kali Anda
                  melakukan push ke branch <code className="font-mono text-slate-900">main</code>,
                  web Purchase Order otomatis terbit!
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-slate-800 bg-slate-900 text-slate-100">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 text-xs">
                  <span className="font-mono text-slate-300">.github/workflows/deploy.yml</span>
                  <button
                    type="button"
                    onClick={handleCopyYaml}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                  >
                    {copiedYaml ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin YAML</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto text-slate-200">
                  {GITHUB_WORKFLOW_YAML}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Cols: Master Katalog Barang */}
      <section className="lg:col-span-7 bg-white border border-slate-200 p-5 space-y-5">
        <div className="pb-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Katalog Master Barang & Jasa ({catalog.length} Item)
          </h2>
          <p className="text-xs text-slate-500">
            Daftar barang di bawah ini dapat dipilih secara instan saat menyusun Purchase Order.
          </p>
        </div>

        {/* Form Tambah Katalog */}
        <form
          onSubmit={handleAddCatalogItem}
          className="p-4 bg-slate-50 border border-slate-200 space-y-3"
        >
          <div className="text-xs font-semibold text-slate-800">Tambah Item Katalog Baru</div>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="Kode SKU (mis. IT-01)"
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div className="sm:col-span-4">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama Barang / Jasa *"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newSpec}
                onChange={(e) => setNewSpec(e.target.value)}
                placeholder="Spesifikasi singkat"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div className="sm:col-span-1">
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Satuan"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                min={0}
                value={newPrice || ''}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                placeholder="Harga Standar (Rp)"
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Kategori (mis. Perangkat IT)"
              className="w-48 px-2.5 py-1 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan ke Katalog</span>
            </button>
          </div>
        </form>

        {/* Tabel Katalog */}
        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Nama Barang & Spesifikasi</th>
                <th className="py-2.5 px-3">Satuan</th>
                <th className="py-2.5 px-3 text-right">Harga Standar</th>
                <th className="py-2.5 px-3 text-center w-12">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {catalog.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800 tabular-nums">
                    {item.sku}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      <span>{item.category}</span>
                      {item.specification && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{item.specification}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{item.unit}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                    {formatCurrency(item.defaultPrice, 'IDR')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeCatalog(catalog.filter((c) => c.id !== item.id))
                      }
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Right 5 Cols: Daftar Vendor / Supplier */}
      <section className="lg:col-span-5 bg-white border border-slate-200 p-5 space-y-5">
        <div className="pb-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Daftar Rekanan Vendor ({vendors.length} Supplier)
          </h2>
          <p className="text-xs text-slate-500">
            Data rekanan supplier untuk pengisian otomatis alamat dan PIC pada form PO.
          </p>
        </div>

        <form
          onSubmit={handleAddVendor}
          className="p-4 bg-slate-50 border border-slate-200 space-y-2.5"
        >
          <div className="text-xs font-semibold text-slate-800">Tambah Vendor Baru</div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={vCode}
              onChange={(e) => setVCode(e.target.value)}
              placeholder="Kode (VND-004)"
              className="px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
            <input
              type="text"
              required
              value={vName}
              onChange={(e) => setVName(e.target.value)}
              placeholder="Nama Perusahaan Vendor *"
              className="col-span-2 px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={vContact}
              onChange={(e) => setVContact(e.target.value)}
              placeholder="Nama Kontak PIC"
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
            <input
              type="text"
              value={vPhone}
              onChange={(e) => setVPhone(e.target.value)}
              placeholder="No. Telepon"
              className="px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              value={vEmail}
              onChange={(e) => setVEmail(e.target.value)}
              placeholder="Email Vendor"
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
            <input
              type="text"
              value={vTerms}
              onChange={(e) => setVTerms(e.target.value)}
              placeholder="Termin Default (Net 30 Hari)"
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
            />
          </div>
          <input
            type="text"
            value={vAddress}
            onChange={(e) => setVAddress(e.target.value)}
            placeholder="Alamat Lengkap Vendor"
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
          />
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan Vendor</span>
            </button>
          </div>
        </form>

        <div className="divide-y divide-slate-200 border border-slate-200">
          {vendors.map((v) => (
            <div key={v.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 tabular-nums">{v.code}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-slate-900">{v.name}</span>
                </div>
                <div className="text-slate-600">{v.address}</div>
                <div className="text-slate-500">
                  <span>PIC: {v.contactPerson || '-'}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono tabular-nums">{v.phone || '-'}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{v.paymentTermsDefault}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeVendors(vendors.filter((item) => item.id !== v.id))}
                className="p-1 text-slate-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
