import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type NivelEducativo = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';

export interface Curso {
  id?: number;
  nombre: string;
  descripcion?: string;
  nivel: NivelEducativo;
  grados: number[];
  seccion?: string;
  profesorIds?: number[];
  profesorNombres?: string[];
  anio?: number;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CursoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/cursos`;

  getAll(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.apiUrl);
  }

  getByNivelAndGrado(nivel: string, grado: number): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}?nivel=${nivel}&grado=${grado}`);
  }

  getMisCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/mis-cursos`);
  }

  getById(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.apiUrl}/${id}`);
  }

  create(curso: Curso): Observable<Curso> {
    return this.http.post<Curso>(this.apiUrl, curso);
  }

  update(id: number, curso: Curso): Observable<Curso> {
    return this.http.put<Curso>(`${this.apiUrl}/${id}`, curso);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reactivate(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/reactivar`, {});
  }
}
