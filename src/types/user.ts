export interface User {
  id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password?: string; // Optional for edit if password not changed
  active?: boolean;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  active?: boolean;
}
