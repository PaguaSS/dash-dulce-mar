import api from './api';

export interface CreateBrandDto {
    name: string;
}

export interface UpdateBrandDto {
    name?: string;
}

export interface Brand {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface BrandResponse {
    data: Brand[];
    total: number;
    page: number;
    limit: number;
}

export const brandService = {
    getAll: async (page = 1, limit = 10, search = '') => {
        const response = await api.get<BrandResponse>('/brands', {
            params: { page, limit, search }
        });
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await api.get<Brand>(`/brands/${id}`);
        return response.data;
    },

    create: async (data: CreateBrandDto) => {
        const response = await api.post<Brand>('/brands', data);
        return response.data;
    },

    update: async (id: string, data: UpdateBrandDto) => {
        const response = await api.patch<Brand>(`/brands/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/brands/${id}`);
    }
};
