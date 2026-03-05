import api from './api';

export interface CreateMetricDto {
    title: string;
    abbrv: string;
}

export interface UpdateMetricDto {
    title?: string;
    abbrv?: string;
}

export interface Metric {
    id: string;
    title: string;
    abbrv: string;
    createdAt: string;
    updatedAt: string;
}

export interface MetricResponse {
    data: Metric[];
    total: number;
    page: number;
    limit: number;
}

export const metricService = {
    getAll: async (page = 1, limit = 10, search = '') => {
        const response = await api.get<MetricResponse>('/metrics', {
            params: { page, limit, search }
        });
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await api.get<Metric>(`/metrics/${id}`);
        return response.data;
    },

    create: async (data: CreateMetricDto) => {
        const response = await api.post<Metric>('/metrics', data);
        return response.data;
    },

    update: async (id: string, data: UpdateMetricDto) => {
        const response = await api.patch<Metric>(`/metrics/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/metrics/${id}`);
    }
};
