export interface User {
  id: string;
  username: string;
  email: string;
  active: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
