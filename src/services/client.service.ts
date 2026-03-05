import api from './api';

export interface CreateClientDto {
    name: string;
    lastname?: string | null;
    phone?: string | null;
    email?: string | null;
}

export interface UpdateClientDto {
    name?: string;
    lastname?: string | null;
    phone?: string | null;
    email?: string | null;
}

export interface Client {
    id: string;
    name: string;
    lastname: string | null;
    phone: string | null;
    email: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ClientResponse {
    data: Client[];
    total: number;
    page: number;
    limit: number;
}

export const clientService = {
    getAll: async (page = 1, limit = 10, search = '') => {
        const response = await api.get<ClientResponse>('/clients', {
            params: { page, limit, search }
        });
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await api.get<Client>(`/clients/${id}`);
        return response.data;
    },

    create: async (data: CreateClientDto) => {
        const response = await api.post<Client>('/clients', data);
        return response.data;
    },

    update: async (id: string, data: UpdateClientDto) => {
        const response = await api.patch<Client>(`/clients/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/clients/${id}`);
    }
};
