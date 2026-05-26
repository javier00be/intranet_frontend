import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioInfo } from '../models';

export interface Profesor {
  id?: number;
  usuario: UsuarioInfo;
  especialidad: string;
  telefono: string;
  activo?: boolean;
}

export interface ProfesorFormOutput {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  telefono: string;
  especialidad: string;
}

@Injectable({ providedIn: 'root' })
export class ProfesorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/profesores`;

  getAll(): Observable<Profesor[]> {
    return this.http.get<Profesor[]>(this.apiUrl);
  }

  getById(id: number): Observable<Profesor> {
    return this.http.get<Profesor>(`${this.apiUrl}/${id}`);
  }

  create(profesor: Profesor): Observable<Profesor> {
    return this.http.post<Profesor>(this.apiUrl, profesor);
  }

  update(id: number, profesor: Profesor): Observable<Profesor> {
    return this.http.put<Profesor>(`${this.apiUrl}/${id}`, profesor);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reactivate(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/reactivar`, {});
  }
}
