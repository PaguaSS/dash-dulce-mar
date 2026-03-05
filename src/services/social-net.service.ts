import api from './api';

export interface SocialNet {
  id: string;
  title: string;
  profileName: string;
  src?: string;
  config?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialNetDto {
  title: string;
  profileName: string;
  src?: string;
  config?: string;
  active: boolean;
}

export interface UpdateSocialNetDto {
  title?: string;
  profileName?: string;
  src?: string;
  config?: string;
  active?: boolean;
}

class SocialNetService {
  async getAll(page = 1, limit = 20) {
    const response = await api.get(`/social-nets/admin?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getOne(id: string) {
    const response = await api.get<SocialNet>(`/social-nets/${id}`);
    return response.data;
  }

  async create(data: CreateSocialNetDto) {
    const response = await api.post<SocialNet>('/social-nets', data);
    return response.data;
  }

  async update(id: string, data: UpdateSocialNetDto) {
    const response = await api.patch<SocialNet>(`/social-nets/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    await api.delete(`/social-nets/${id}`);
  }
}

export const socialNetService = new SocialNetService();
