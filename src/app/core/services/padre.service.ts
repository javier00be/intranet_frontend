import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioInfo } from '../models';

export interface Padre {
  id?: number;
  usuario: UsuarioInfo;
  telefono: string;
  hijoIds?: number[];
  activo?: boolean;
}

export interface PadreFormOutput {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  telefono: string;
}

@Injectable({ providedIn: 'root' })
export class PadreService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/padres`;

  getMe(): Observable<Padre> {
    return this.http.get<Padre>(`${this.apiUrl}/me`);
  }

  getAll(): Observable<Padre[]> {
    return this.http.get<Padre[]>(this.apiUrl);
  }

  getById(id: number): Observable<Padre> {
    return this.http.get<Padre>(`${this.apiUrl}/${id}`);
  }

  create(padre: Padre): Observable<Padre> {
    return this.http.post<Padre>(this.apiUrl, padre);
  }

  update(id: number, padre: Padre): Observable<Padre> {
    return this.http.put<Padre>(`${this.apiUrl}/${id}`, padre);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addHijo(padreId: number, estudianteId: number): Observable<Padre> {
    return this.http.post<Padre>(`${this.apiUrl}/${padreId}/hijos/${estudianteId}`, {});
  }

  removeHijo(padreId: number, estudianteId: number): Observable<Padre> {
    return this.http.delete<Padre>(`${this.apiUrl}/${padreId}/hijos/${estudianteId}`);
  }

  reactivate(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/reactivar`, {});
  }
}
