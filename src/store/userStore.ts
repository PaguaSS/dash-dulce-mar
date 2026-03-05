import { create } from 'zustand';
import { userService } from '../services/user.service';
import type { User } from '../types/user';

interface UserState {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  createUser: (data: any) => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  total: 0,
  loading: false,
  error: null,

  fetchUsers: async (page = 1, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const { users, total } = await userService.getAll(page, limit);
      set({ users, total, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to fetch users' });
    }
  },

  createUser: async (data) => {
    set({ loading: true, error: null });
    try {
      await userService.create(data);
      await get().fetchUsers(); // Refresh list
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to create user' });
      throw err; // Re-throw to handle in UI
    }
  },

  updateUser: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await userService.update(id, data);
      await get().fetchUsers(); // Refresh list
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to update user' });
      throw err;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await userService.delete(id);
      await get().fetchUsers(); // Refresh list
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to delete user' });
      throw err;
    }
  },
}));
