import api from './api';
import type { User, CreateUserDto, UpdateUserDto } from '../types/user';

export const userService = {
  getAll: async (page = 1, limit = 20): Promise<{ users: User[], total: number }> => {
    const response = await api.get('/users', { params: { page, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
