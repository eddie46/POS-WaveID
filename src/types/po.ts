export type POStatus = 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Terkirim' | 'Selesai' | 'Dibatalkan';

export type CurrencyCode = 'IDR' | 'USD';

export interface POLineItem {
  id: string;
  sku: string;
  name: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  taxId: string; // NPWP
  preparedBy: string;
  preparedRole: string;
  approvedBy: string;
  approvedRole: string;
}

export interface VendorPreset {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTermsDefault: string;
}

export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  specification: string;
  unit: string;
  defaultPrice: number;
  category: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  issueDate: string;
  deliveryDate: string;
  status: POStatus;
  currency: CurrencyCode;
  paymentTerms: string;
  vendorName: string;
  vendorContact: string;
  vendorPhone: string;
  vendorEmail: string;
  vendorAddress: string;
  shipToSameAsCompany: boolean;
  shipToName: string;
  shipToAddress: string;
  shipToPhone: string;
  items: POLineItem[];
  discountPercent: number;
  taxPercent: number; // e.g., 11 for PPN 11%
  shippingCost: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
