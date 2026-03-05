
import api from './api';

import { MediaType, PostStatus, ScheduleType } from '../types/social-post.types';

export interface SocialPost {
    id: string;
    content: string | null;
    mediaUrl: string | null;
    mediaType: MediaType;
    scheduledFor: string | null;
    status: PostStatus;
    results: any | null;
    networkIds: string[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSocialPostDto {
    content?: string;
    media?: File | null;
    mediaType?: MediaType;
    scheduledFor?: string; // ISO
    scheduleType?: ScheduleType;
    networkIds?: string[];
}

export const socialPostService = {
  
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get<{ data: SocialPost[], total: number, page: number, limit: number }>('/social-posts', {
      params: { page, limit }
    });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get<SocialPost>(`/social-posts/${id}`);
    return response.data;
  },

  create: async (data: CreateSocialPostDto) => {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.media) formData.append('media', data.media);
    if (data.mediaType) formData.append('mediaType', data.mediaType);
    if (data.scheduledFor) formData.append('scheduledFor', data.scheduledFor);
    if (data.scheduleType) formData.append('scheduleType', data.scheduleType);
    if (data.networkIds) {
        data.networkIds.forEach(id => formData.append('networkIds[]', id));
    }

    const response = await api.post<SocialPost>('/social-posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  update: async (id: string, data: CreateSocialPostDto) => {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.media) formData.append('media', data.media);
    if (data.mediaType) formData.append('mediaType', data.mediaType);
    if (data.scheduledFor) formData.append('scheduledFor', data.scheduledFor);
    if (data.scheduleType) formData.append('scheduleType', data.scheduleType);
    if (data.networkIds) {
        data.networkIds.forEach(id => formData.append('networkIds[]', id));
    }

    const response = await api.put<SocialPost>(`/social-posts/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  publish: async (id: string) => {
    const response = await api.post<SocialPost>(`/social-posts/${id}/publish`);
    return response.data;
  }
};
