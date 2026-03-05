import api from './api';

export interface CreateIngredientDto {
    name: string;
    price: number;
    metricId: string;
    brandId?: string | null;
    isPackagePrice?: boolean;
    packagePrice?: number | null;
    packageQty?: number | null;
    packageMetricId?: string | null;
}

export interface UpdateIngredientDto {
    name?: string;
    price?: number;
    metricId?: string;
    brandId?: string | null;
    isPackagePrice?: boolean;
    packagePrice?: number | null;
    packageQty?: number | null;
    packageMetricId?: string | null;
}

export interface Ingredient {
    id: string;
    name: string;
    price: number | string;
    metricId: string;
    brandId?: string | null;
    brand?: {
        id: string;
        name: string;
    } | null;
    isPackagePrice: boolean;
    packagePrice?: number | string | null;
    packageQty?: number | string | null;
    packageMetric?: string | null; // Stored as abbreviation string (e.g., "kg")
    metric?: {
        id: string;
        title: string;
        abbrv: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface IngredientResponse {
    data: Ingredient[];
    total: number;
    page: number;
    limit: number;
}

export const ingredientService = {
    getAll: async (page = 1, limit = 10, search = '') => {
        const response = await api.get<IngredientResponse>('/ingredients', {
            params: { page, limit, search }
        });
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await api.get<Ingredient>(`/ingredients/${id}`);
        return response.data;
    },

    create: async (data: CreateIngredientDto) => {
        const response = await api.post<Ingredient>('/ingredients', data);
        return response.data;
    },

    update: async (id: string, data: UpdateIngredientDto) => {
        const response = await api.patch<Ingredient>(`/ingredients/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/ingredients/${id}`);
    }
};
