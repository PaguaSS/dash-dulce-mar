import api from './api';
import { QuotationItemType } from './quotation.service';

export const PaymentMethod = {
  CREDIT_CARD: 'CREDIT_CARD',
  CASH: 'CASH',
  SINPE: 'SINPE',
  PAYPAL: 'PAYPAL',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const SaleSource = {
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK: 'TIKTOK',
  WEBSITE: 'WEBSITE',
  DASHBOARD: 'DASHBOARD',
} as const;

export type SaleSource = typeof SaleSource[keyof typeof SaleSource];

export interface InvoiceItem {
  id: string;
  type: QuotationItemType;
  itemReferenceId: string | null;
  name: string;
  quantity: number;
  metric: string | null;
  unitPrice: number;
  subtotal: number;
  isIncluded: boolean;
  metadata: any | null;
}

export interface Invoice {
  id: string;
  serialNumber: string;
  description: string;
  clientId: string;
  client?: any;
  quotationId: string | null;
  subtotal: number;
  taxRate: number;
  profitMargin: number;
  tax: number;
  profit: number;
  total: number;
  paymentMethod: PaymentMethod;
  source: SaleSource;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  description: string;
  clientId: string;
  quotationId?: string | null;
  taxRate: number;
  profitMargin: number;
  subtotal: number;
  tax: number;
  profit: number;
  total: number;
  paymentMethod: PaymentMethod;
  source: SaleSource;
  items: Omit<InvoiceItem, 'id'>[];
}

export interface UpdateInvoiceDto {
  description: string;
  clientId: string;
  quotationId?: string | null;
  taxRate: number;
  profitMargin: number;
  subtotal: number;
  tax: number;
  profit: number;
  total: number;
  paymentMethod: PaymentMethod;
  source: SaleSource;
  items: InvoiceItem[];
}

export interface FilterInvoiceParams {
  clientId?: string;
  paymentMethod?: PaymentMethod;
  source?: SaleSource;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SalesSummary {
  totalSold: number;
  byPaymentMethod: Record<PaymentMethod, number>;
  bySource: Record<SaleSource, number>;
}

export const invoiceService = {
  getAll: async (params: FilterInvoiceParams) => {
    const response = await api.get<{ data: Invoice[]; meta: any }>('/invoices', { params });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceDto) => {
    const response = await api.post<Invoice>('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateInvoiceDto>) => {
    const response = await api.put<Invoice>(`/invoices/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    await api.delete(`/invoices/${id}`);
  },

  getSummary: async () => {
    const response = await api.get<SalesSummary>('/invoices/summary');
    return response.data;
  },
};
