import api from './api';

const CALCULATOR_BASE = '/calculator';

// Types
export type CalculatorCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  portionType: 'fixed' | 'range' | 'unit';
  minPortions: number | null;
  maxPortions: number | null;
  fixedPortionOptions: number[] | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CalculatorOption = {
  id: string;
  categoryId: string;
  optionType: 'FLAVOR' | 'TYPE' | 'BASE' | 'FILLING' | 'COVERING' | 'PRODUCT';
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  priceModifier: number;
  isPercentage: boolean;
  conditions: { showWhen?: { [key: string]: string[] } } | null;
  sortOrder: number;
  active: boolean;
  isMainProduct: boolean;
  category?: CalculatorCategory;
  customizationLinks?: ProductOptionCustomization[];
};

export type ProductOptionCustomization = {
  id: string;
  mainProductOptionId: string;
  customizationOptionId: string;
  customizationOption?: CalculatorOption;
  sortOrder: number;
  createdAt: string;
};

export type CalculatorPricing = {
  id: string;
  categorySlug: string;
  basePrice: number;
  pricePerPortion: number;
  portionRanges: Array<{ min: number; max: number; pricePerPortion: number }> | null;
  modifiers: Array<{ optionSlug: string; modifier: number; isPercentage: boolean }> | null;
  currency: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export const calculatorProductsService = {
  // Categories
  getCategories: (params?: { page?: number; limit?: number; search?: string; active?: boolean }) =>
    api.get<PaginatedResponse<CalculatorCategory>>(`${CALCULATOR_BASE}/categories`, { params }),

  getCategoryBySlug: (slug: string) =>
    api.get<CalculatorCategory>(`${CALCULATOR_BASE}/categories/${slug}`),

  createCategory: (data: Partial<CalculatorCategory>) =>
    api.post<CalculatorCategory>(`${CALCULATOR_BASE}/categories`, data),

  updateCategory: (id: string, data: Partial<CalculatorCategory>) =>
    api.put<CalculatorCategory>(`${CALCULATOR_BASE}/categories/${id}`, data),

  deleteCategory: (id: string) => api.delete(`${CALCULATOR_BASE}/categories/${id}`),

  // Options
  getOptions: (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    optionType?: string;
    active?: boolean;
    isMainProduct?: boolean;
  }) => api.get<PaginatedResponse<CalculatorOption>>(`${CALCULATOR_BASE}/options`, { params }),

  createOption: (data: Partial<CalculatorOption>, image?: File) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (image) {
      formData.append('image', image);
    }
    return api.post<CalculatorOption>(`${CALCULATOR_BASE}/options`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateOption: (id: string, data: Partial<CalculatorOption>, image?: File) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (image) {
      formData.append('image', image);
    }
    return api.put<CalculatorOption>(`${CALCULATOR_BASE}/options/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteOption: (id: string) => api.delete(`${CALCULATOR_BASE}/options/${id}`),

  // Main Product Options
  getMainProductOptions: (params?: { categoryId?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<CalculatorOption>>(`${CALCULATOR_BASE}/options/main-products`, { params }),

  getMainProductOptionWithCustomizations: (id: string) =>
    api.get<CalculatorOption>(`${CALCULATOR_BASE}/options/${id}/customizations`),

  getAvailableCustomizations: (mainProductOptionId: string, categoryId?: string) =>
    api.get<CalculatorOption[]>(`${CALCULATOR_BASE}/options/${mainProductOptionId}/available-customizations`, {
      params: categoryId ? { categoryId } : undefined,
    }),

  setCustomizations: (mainProductOptionId: string, customizationIds: string[]) =>
    api.put<CalculatorOption>(`${CALCULATOR_BASE}/options/${mainProductOptionId}/customizations`, {
      customizationIds,
    }),

  toggleMainProductOption: (optionId: string, isMainProduct: boolean) =>
    api.patch<CalculatorOption>(`${CALCULATOR_BASE}/options/${optionId}/main-product`, { isMainProduct }),

  // Pricing
  getPricing: (categorySlug: string) =>
    api.get<CalculatorPricing>(`${CALCULATOR_BASE}/pricing/${categorySlug}`),

  updatePricing: (categorySlug: string, data: Partial<CalculatorPricing>) =>
    api.put<CalculatorPricing>(`${CALCULATOR_BASE}/pricing/${categorySlug}`, data),

  // Estimate (public)
  getEstimate: (data: { category: string; selections: Record<string, string | number> }) =>
    api.post(`${CALCULATOR_BASE}/estimate`, data),
};

export default calculatorProductsService;
