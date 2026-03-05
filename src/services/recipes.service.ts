import api from './api';

export interface RecipeItem { // Represents a recipe ingredient now
    id: string;
    recipeId: string;
    ingredientId: string;
    ingredient: {
        id: string;
        name: string;
        price: number;
        metric?: {
            id: string;
            title: string;
            abbrv: string;
        };
    };
    metricId: string;
    metric?: {
        id: string;
        title: string;
        abbrv: string;
    };
    qty: number;
    // name/price are derived from ingredient
    name?: string; 
    price?: number;
}

export interface Recipe {
    id: string;
    title: string;
    servings: number;
    ingredients: RecipeItem[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateRecipeItemDto {
    metricId: string;
    ingredientId: string;
    qty: number;
}

export interface CreateRecipeDto {
    title: string;
    servings: number;
    ingredients: CreateRecipeItemDto[];
}

export interface UpdateRecipeDto {
    title?: string;
    servings?: number;
    ingredients?: CreateRecipeItemDto[];
}

export interface RecipeListResponse {
    data: Recipe[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface RecipeFilters {
    page?: number;
    limit?: number;
    search?: string;
}

export const recipesService = {
  async getAll(params: RecipeFilters = {}) {
    const response = await api.get<RecipeListResponse>('/recipes', { params });
    return response.data;
  },

  async getOne(id: string) {
    const response = await api.get<Recipe>(`/recipes/${id}`);
    return response.data;
  },

  async create(data: CreateRecipeDto) {
    const response = await api.post<Recipe>('/recipes', data);
    return response.data;
  },

  async update(id: string, data: UpdateRecipeDto) {
    const response = await api.patch<Recipe>(`/recipes/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/recipes/${id}`);
  },
};
