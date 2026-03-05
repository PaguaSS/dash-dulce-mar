import api from './api';
import type { Agenda, CreateAgendaDto, UpdateAgendaDto, AgendaFilters, AgendaResponse } from '../types/agenda';

export const agendaService = {
  /* Configured with centralized API instance (supports token refresh) */
  getAll: async (filters: AgendaFilters = {}): Promise<AgendaResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.description) params.append('description', filters.description);
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.day) params.append('day', filters.day.toString());
    if (filters.date) params.append('date', filters.date);

    const response = await api.get<AgendaResponse>('/agenda', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Agenda> => {
    const response = await api.get<Agenda>(`/agenda/${id}`);
    return response.data;
  },

  create: async (data: CreateAgendaDto): Promise<Agenda> => {
    const response = await api.post<Agenda>('/agenda', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAgendaDto): Promise<Agenda> => {
    const response = await api.put<Agenda>(`/agenda/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/agenda/${id}`);
  },

  uploadItems: async (id: string, files: File[]): Promise<void> => {
    // API endpoint expects single file per request based on routes, or we loop?
    // Route: router.post('/:id/items', upload.single('file'), ...)
    // So we must loop.
    
    // Ideally backend should support array, but for now we loop here to minimize backend changes unless necessary.
    // User asked "allow field to upload multiple files". 
    // We already have 403 issue, maybe safer to loop frontend side for now.
    
    for (const file of files) {
       const formData = new FormData();
       formData.append('file', file);
       // Axios instance handles Auth header, but let browser set Content-Type multipart
       await api.post(`/agenda/${id}/items`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
       });
    }
  },

  deleteItem: async (itemId: string): Promise<void> => {
    await api.delete(`/agenda/items/${itemId}`);
  },
};
