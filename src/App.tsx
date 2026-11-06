/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Minus,
  Plus,
  Printer,
  Send,
  Settings,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface OrderItemEntry {
  productId: string;
  productName: string;
  price: number;
  qty: number;
}

export interface SimplePOOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItemEntry[];
  totalAmount: number;
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Produk 1',
    description: 'Pilihan paket / varian produk pertama',
    price: 50000,
  },
  {
    id: 'prod-2',
    name: 'Produk 2',
    description: 'Pilihan paket / varian produk kedua',
    price: 75000,
  },
  {
    id: 'prod-3',
    name: 'Produk 3',
    description: 'Pilihan paket / varian produk ketiga',
    price: 100000,
  },
];

const STORAGE_KEYS = {
  PRODUCTS: 'simple_po_products_v1',
  ORDERS: 'simple_po_orders_v1',
  STORE_CONFIG: 'simple_po_store_config_v1',
};

interface StoreConfig {
  storeTitle: string;
  adminWhatsapp: string;
}

const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeTitle: 'Form PO Sederhana',
  adminWhatsapp: '',
};

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'orders' | 'settings'>('form');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [titleClickCount, setTitleClickCount] = useState(0);

  const handleTitleClick = () => {
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    if (newCount >= 5) {
      setIsAdminUnlocked(true);
      setTitleClickCount(0);
    }
  };

  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  });

  const [orders, setOrders] = useState<SimplePOOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORE_CONFIG);
      return saved ? JSON.parse(saved) : DEFAULT_STORE_CONFIG;
    } catch {
      return DEFAULT_STORE_CONFIG;
    }
  });

  // Form State
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    DEFAULT_PRODUCTS.forEach(p => initial[p.id] = 0);
    return initial;
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [latestOrder, setLatestOrder] = useState<SimplePOOrder | null>(null);
  const [copiedOrderText, setCopiedOrderText] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STORE_CONFIG, JSON.stringify(storeConfig));
    } catch {
      // ignore
    }
  }, [storeConfig]);

  const handleQtyChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [productId]: next };
    });
    setFormError(null);
  };

  const handleDirectQtyInput = (productId: string, val: string) => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    setQuantities((prev) => ({ ...prev, [productId]: parsed }));
    setFormError(null);
  };

  const selectedItems: OrderItemEntry[] = products
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      price: p.price,
      qty: quantities[p.id] || 0,
    }))
    .filter((item) => item.qty > 0);

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = selectedItems.reduce((sum, item) => sum + item.qty, 0);

  const buildOrderText = (order: SimplePOOrder) => {
    const itemLines = order.items
      .map(
        (item) =>
          `- ${item.productName} (${item.qty} x ${formatRupiah(item.price)}) = ${formatRupiah(
            item.qty * item.price
          )}`
      )
      .join('\n');

    return [
      `*PESANAN BARU (${order.orderNumber})*`,
      `Tanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}`,
      ``,
      `*Daftar Produk:*`,
      itemLines,
      `*Total: ${formatRupiah(order.totalAmount)}*`,
      ``,
      `*Data Pemesan:*`,
      `Nama: ${order.customerName}`,
      `No. Tlpn: ${order.customerPhone}`,
      `Alamat: ${order.customerAddress}`,
    ].join('\n');
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setFormError('Pilih minimal 1 produk (jumlah > 0).');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setFormError('Mohon lengkapi Nama, No. Telepon, dan Alamat.');
      return;
    }

    const newOrder: SimplePOOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `PO-${String(orders.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items: selectedItems,
      totalAmount,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setLatestOrder(newOrder);
    setFormError(null);

    // If admin WhatsApp number is configured, open WhatsApp link in new tab or prepare link
    const cleanWa = storeConfig.adminWhatsapp.replace(/[^0-9]/g, '');
    const waNumber = cleanWa.startsWith('0') ? `62${cleanWa.slice(1)}` : cleanWa;
    const text = encodeURIComponent(buildOrderText(newOrder));
    if (waNumber) {
      window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
    }
  };

  const handleResetForm = () => {
    setLatestOrder(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    const resetQuantities: Record<string, number> = {};
    products.forEach(p => resetQuantities[p.id] = 0);
    setQuantities(resetQuantities);
  };

  const handleCopyOrderText = (order: SimplePOOrder) => {
    navigator.clipboard.writeText(buildOrderText(order));
    setCopiedOrderText(true);
    setTimeout(() => setCopiedOrderText(false), 2000);
  };

  const handleExportCSV = async () => {
    const { utils, writeFile } = await import('xlsx');
    const headers = ['No PO', 'Waktu Pesan', 'Nama', 'No Tlpn', 'Alamat', 'Rincian Produk', 'Total'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('id-ID'),
      o.customerName,
      o.customerPhone,
      o.customerAddress,
      o.items.map((i) => `${i.productName} (${i.qty})`).join('; '),
      o.totalAmount,
    ]);

    const worksheet = utils.aoa_to_sheet([headers, ...rows]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Pesanan');
    writeFile(workbook, 'Rekap_Pesanan_PO.xlsx');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="no-print bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-8">
        <a
          href="#form"
          onClick={(e) => {
            e.preventDefault();
            handleTitleClick();
            setActiveTab('form');
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {storeConfig.storeTitle || 'Form PO Sederhana'}
        </a>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#form"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('form');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'form'
                ? 'text-slate-900 underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900'
            }`}
          >
            Pesan Produk
          </a>
          {isAdminUnlocked && (
            <>
              <a
                href="#orders"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('orders');
                }}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'orders'
                    ? 'text-slate-900 underline underline-offset-8 decoration-2'
                    : 'hover:text-slate-900'
                }`}
              >
                Rekap Pesanan ({orders.length})
              </a>
              <a
                href="#settings"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('settings');
                }}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'settings'
                    ? 'text-slate-900 underline underline-offset-8 decoration-2'
                    : 'hover:text-slate-900'
                }`}
              >
                Atur Produk
              </a>
            </>
          )}
        </nav>

        <div className="flex items-center shrink-0">
          {isAdminUnlocked && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Produk</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {activeTab === 'form' && (
          <div className="bg-white border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Purchase Order (PO) Sederhana</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih jumlah produk dan isi data pemesan di bawah ini.
                </p>
              </div>
              <ShoppingBag className="w-5 h-5 text-slate-400 shrink-0" />
            </div>

            {!latestOrder ? (
              <form onSubmit={handleSubmitOrder} className="space-y-6">
                {/* Daftar Produk */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Pilih Produk
                    </label>
                    <span className="text-xs text-slate-500">Jumlah</span>
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200">
                    {products.map((product) => {
                      const qty = quantities[product.id] || 0;
                      const isSelected = qty > 0;
                      return (
                        <div
                          key={product.id}
                          className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                            isSelected ? 'bg-slate-50/80' : 'bg-white'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="text-sm font-semibold text-slate-900">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-xs text-slate-500">{product.description}</div>
                            )}
                            <div className="text-xs font-mono font-medium text-slate-700 tabular-nums pt-0.5">
                              {formatRupiah(product.price)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(product.id, -1)}
                              aria-label={`Kurangi ${product.name}`}
                              className="w-9 h-9 flex items-center justify-center border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={qty}
                              onChange={(e) => handleDirectQtyInput(product.id, e.target.value)}
                              className="w-14 h-9 text-center text-sm font-mono font-semibold border border-slate-300 bg-white focus:outline-none focus:border-slate-900 tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyChange(product.id, 1)}
                              aria-label={`Tambah ${product.name}`}
                              className="w-9 h-9 flex items-center justify-center border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtotal Strip */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border border-slate-200 text-xs">
                    <span className="font-medium text-slate-700">
                      Total ({totalQty} item dipilih)
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Form Data Pemesan */}
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div>
                    <label
                      htmlFor="input-nama"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Nama
                    </label>
                    <input
                      id="input-nama"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setFormError(null);
                      }}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-tlpn"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      No. Tlpn / WhatsApp
                    </label>
                    <input
                      id="input-tlpn"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        setFormError(null);
                      }}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-alamat"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Alamat
                    </label>
                    <textarea
                      id="input-alamat"
                      rows={3}
                      required
                      value={customerAddress}
                      onChange={(e) => {
                        setCustomerAddress(e.target.value);
                        setFormError(null);
                      }}
                      placeholder="Masukkan alamat lengkap pengiriman"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                    {formError}
                  </div>
                )}

                {/* Tombol Pesan */}
                <button
                  type="submit"
                  className="w-full py-3 px-6 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Pesan</span>
                </button>
              </form>
            ) : (
              /* Bukti / Ringkasan Pesanan Setelah Klik Pesan */
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span className="font-semibold">
                    Pesanan berhasil dibuat dengan nomor {latestOrder.orderNumber}
                  </span>
                  <span className="font-mono tabular-nums">
                    {new Date(latestOrder.createdAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="border border-slate-200 p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-slate-500">Nomor PO</div>
                      <div className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                        {latestOrder.orderNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500">Tanggal</div>
                      <div className="font-mono text-slate-900 tabular-nums">
                        {new Date(latestOrder.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-slate-700">Data Pemesan</div>
                    <div className="text-slate-900 font-medium">{latestOrder.customerName}</div>
                    <div className="font-mono text-slate-600 tabular-nums">
                      {latestOrder.customerPhone}
                    </div>
                    <div className="text-slate-600">{latestOrder.customerAddress}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="font-semibold text-slate-700">Rincian Produk</div>
                    {latestOrder.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between text-slate-800"
                      >
                        <span>
                          {item.productName} &times; {item.qty}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatRupiah(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-sm font-bold text-slate-900">
                      <span>Total Bayar</span>
                      <span className="font-mono tabular-nums">
                        {formatRupiah(latestOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="no-print flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyOrderText(latestOrder)}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedOrderText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Teks Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks WA</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2.5 px-4 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Struk</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-2.5 px-5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Buat Pesanan Baru
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Rekap Pesanan Masuk ({orders.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Data tersimpan otomatis di browser perangkat ini.
                </p>
              </div>
              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Excel</span>
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-3">
                <div>Belum ada pesanan yang masuk.</div>
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Isi Form PO Pertama
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {ord.orderNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-900">{ord.customerName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-600 tabular-nums">
                          {ord.customerPhone}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setOrders((prev) => prev.filter((item) => item.id !== ord.id))
                        }
                        title="Hapus pesanan"
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-slate-600">Alamat: {ord.customerAddress}</div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-slate-700">
                        {ord.items.map((i) => `${i.productName} (${i.qty})`).join(', ')}
                      </div>
                      <div className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(ord.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200 p-6 space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Pengaturan Produk & Toko</h2>
              <p className="text-xs text-slate-500">
                Ubah nama Produk 1, Produk 2, Produk 3, harga, atau nomor WhatsApp penerima pesanan.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Form / Nama Toko
                </label>
                <input
                  type="text"
                  value={storeConfig.storeTitle}
                  onChange={(e) =>
                    setStoreConfig({ ...storeConfig, storeTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Tujuan saat Klik &ldquo;Pesan&rdquo; (Opsional)
                </label>
                <input
                  type="tel"
                  value={storeConfig.adminWhatsapp}
                  onChange={(e) =>
                    setStoreConfig({ ...storeConfig, adminWhatsapp: e.target.value })
                  }
                  placeholder="Contoh: 081234567890 (Kosongkan jika hanya simpan di web)"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700">Daftar Produk</div>
                <button
                  type="button"
                  onClick={() =>
                    setProducts((prev) => [
                      ...prev,
                      {
                        id: `prod-${Date.now()}`,
                        name: `Produk ${prev.length + 1}`,
                        description: 'Deskripsi produk',
                        price: 50000,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Produk</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {products.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] text-slate-500 mb-0.5">
                        Nama Produk #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={prod.name}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === prod.id ? { ...p, name: e.target.value } : p
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] text-slate-500 mb-0.5">Keterangan</label>
                      <input
                        type="text"
                        value={prod.description}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === prod.id ? { ...p, description: e.target.value } : p
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] text-slate-500 mb-0.5">Harga (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        value={prod.price}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === prod.id
                                ? { ...p, price: Math.max(0, Number(e.target.value)) }
                                : p
                            )
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 focus:outline-none focus:border-slate-900 tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end pt-4">
                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setProducts((prev) => prev.filter((p) => p.id !== prod.id))
                          }
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Selesai & Kembali ke Form PO
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
