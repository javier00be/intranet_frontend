import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, UserRole } from '../models';
import { JwtService } from './jwt.service';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

function mapRole(rol: string): UserRole {
  const normalized = rol.toLowerCase();
  if (normalized === 'director' || normalized === 'profesor' || normalized === 'padre' || normalized === 'estudiante') {
    return normalized as UserRole;
  }
  return 'estudiante';
}

interface BackendAuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
    avatar: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private jwtService = inject(JwtService);

  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal<boolean>(false);
  private loading = signal<boolean>(false);

  user = this.currentUser.asReadonly();
  authenticated = this.isAuthenticated.asReadonly();
  isLoading = this.loading.asReadonly();

  constructor() {
    this.checkStoredAuth();
  }

  private checkStoredAuth(): void {
    const token = this.jwtService.getToken();
    const user = this.jwtService.getUser();
    
    if (token && user && !this.jwtService.isTokenExpired()) {
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
    } else {
      this.jwtService.removeToken();
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    this.loading.set(true);

    try {
      const response = await this.http.post<BackendAuthResponse>(`${API_URL}/api/auth/login`, {
        email,
        password
      }).toPromise();

      if (response?.success && response.token && response.user) {
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          nombre: response.user.nombre,
          apellido: response.user.apellido,
          rol: mapRole(response.user.rol),
          avatar: response.user.avatar
        };

        this.jwtService.setToken(response.token);
        this.jwtService.setUser(user);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        this.loading.set(false);

        return { success: true, user };
      }

      this.loading.set(false);
      return { success: false, message: response?.message || 'Credenciales inválidas' };
    } catch (error: any) {
      this.loading.set(false);
      return { success: false, message: error.error?.message || 'Error de conexión' };
    }
  }

  async register(data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    rol?: 'estudiante' | 'profesor';
  }): Promise<RegisterResponse> {
    this.loading.set(true);

    try {
      const response = await this.http.post<BackendAuthResponse>(`${API_URL}/api/auth/register`, {
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol?.toUpperCase() || 'ESTUDIANTE'
      }).toPromise();

      if (response?.success && response.token && response.user) {
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          nombre: response.user.nombre,
          apellido: response.user.apellido,
          rol: mapRole(response.user.rol),
          avatar: response.user.avatar
        };

        this.jwtService.setToken(response.token);
        this.jwtService.setUser(user);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        this.loading.set(false);

        return { success: true, message: 'Usuario registrado exitosamente' };
      }

      this.loading.set(false);
      return { success: false, message: response?.message || 'Error al registrar' };
    } catch (error: any) {
      this.loading.set(false);
      return { success: false, message: error.error?.message || 'Error de conexión' };
    }
  }

  logout(): void {
    this.jwtService.removeToken();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  async forgotPassword(email: string): Promise<RegisterResponse> {
    this.loading.set(true);

    try {
      const response = await this.http.post<BackendAuthResponse>(`${API_URL}/api/auth/forgot-password`, {
        email
      }).toPromise();

      this.loading.set(false);
      
      if (response?.success) {
        return { success: true, message: response.message || 'Se ha enviado un enlace de recuperación a tu correo' };
      }

      return { success: false, message: response?.message || 'Error al procesar la solicitud' };
    } catch (error: any) {
      this.loading.set(false);
      return { success: false, message: error.error?.message || 'Error de conexión' };
    }
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.rol) : false;
  }
}