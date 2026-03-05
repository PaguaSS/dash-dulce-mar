export interface Category {
  id: string;
  title: string;
  description: string;
  image: string;
  active: boolean;
  parentCategoryId?: string | null;
  parent?: Category;
  createdAt?: string;
  updatedAt?: string;
  children?: Category[];
}

export interface CategoryItem {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  image: string;
  active: boolean;
  isTop: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PortfolioItemType = 'CATEGORY' | 'ITEM';

export interface PortfolioItem {
  id: string;
  type: PortfolioItemType;
  parentId: string | null; // For items this maps to categoryId, for categories to parentCategoryId
  title: string;
  description: string;
  image: string;
  active: boolean;
  isTop?: boolean; // Only applies to ITEM type
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioListResponse {
  data: PortfolioItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryListResponse {
  data: Category[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  isTop?: boolean;
  parentCategoryId?: string | null;
  parentId?: string | null; // Unified catalog filter
  type?: PortfolioItemType;
}

import api from './api';

export const categoryService = {
  // --- Legacy / Specific Category Enpoints ---
  async getAll(params: CategoryFilters = {}) {
    const response = await api.get<CategoryListResponse>('/categories/admin', { params });
    return response.data;
  },

  async getOne(id: string) {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async create(data: FormData) {
    const response = await api.post<Category>('/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async update(id: string, data: FormData) {
    const response = await api.patch<Category>(`/categories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async delete(id: string, force = false) {
    await api.delete(`/categories/${id}`, { params: { force } });
  },

  // --- Unified Portfolio Endpoints ---
  async getContents(params: CategoryFilters = {}) {
    const response = await api.get<PortfolioListResponse>('/portfolio', { params });
    return response.data; // Note: API returns { data: [], meta: {} }
  },

  // --- Category Item Endpoints ---
  async getItem(id: string) {
    const response = await api.get<CategoryItem>(`/category-items/${id}`);
    return response.data;
  },

  async createItem(data: FormData) {
    const response = await api.post<CategoryItem>('/category-items', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateItem(id: string, data: FormData) {
    const response = await api.patch<CategoryItem>(`/category-items/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteItem(id: string) {
    await api.delete(`/category-items/${id}`);
  },

  async updateItemIsTop(id: string, isTop: boolean) {
    const response = await api.patch<CategoryItem>(`/category-items/${id}/is-top`, { isTop });
    return response.data;
  },
};

