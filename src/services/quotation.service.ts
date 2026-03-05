import api from './api';

export const QuotationItemType = {
    RECIPE: 'RECIPE',
    INGREDIENT: 'INGREDIENT',
    CUSTOM: 'CUSTOM',
    WATER: 'WATER',
    BAKE_TIME: 'BAKE_TIME',
    LABOR: 'LABOR',
    DELIVERY: 'DELIVERY',
} as const;

export type QuotationItemType = typeof QuotationItemType[keyof typeof QuotationItemType];

export interface QuotationItem {
    id?: string;
    type: QuotationItemType;
    itemReferenceId?: string | null;
    name: string;
    quantity: number;
    metric?: string | null;
    unitPrice: number;
    subtotal: number;
    metadata?: Record<string, any> | null;
}

export interface Quotation {
    id: string;
    description: string;
    clientId: string | null;
    client?: {
        id: string;
        name: string;
        lastname: string | null;
    } | null;
    items: QuotationItem[];
    taxRate: number;
    profitMargin: number;
    subtotal: number;
    tax: number;
    profit: number;
    total: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateQuotationItemDto {
    type: QuotationItemType;
    itemReferenceId?: string | null;
    name: string;
    quantity: number;
    metric?: string | null;
    unitPrice: number;
    subtotal: number;
    metadata?: Record<string, any> | null;
}

export interface CreateQuotationDto {
    description: string;
    clientId?: string | null;
    taxRate: number;
    profitMargin: number;
    subtotal: number;
    tax: number;
    profit: number;
    total: number;
    items: CreateQuotationItemDto[];
}

export interface UpdateQuotationDto {
    description?: string;
    clientId?: string | null;
    taxRate?: number;
    profitMargin?: number;
    subtotal?: number;
    tax?: number;
    profit?: number;
    total?: number;
    items?: CreateQuotationItemDto[];
}

export interface QuotationResponse {
    data: Quotation[];
    total: number;
    page: number;
    limit: number;
}

export const quotationService = {
    getAll: async (page = 1, limit = 10, search = '') => {
        const response = await api.get<QuotationResponse>('/quotations', {
            params: { page, limit, search }
        });
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await api.get<Quotation>(`/quotations/${id}`);
        return response.data;
    },

    create: async (data: CreateQuotationDto) => {
        const response = await api.post<Quotation>('/quotations', data);
        return response.data;
    },

    update: async (id: string, data: UpdateQuotationDto) => {
        const response = await api.put<Quotation>(`/quotations/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/quotations/${id}`);
    }
};
