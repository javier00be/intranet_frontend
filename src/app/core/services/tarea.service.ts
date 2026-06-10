import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TareaDTO {
  id?: number;
  cursoId?: number;
  cursoNombre?: string;
  titulo: string;
  descripcion?: string;
  fechaEntrega?: string;
  archivoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class TareaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/tareas`;

  getMisTareas(): Observable<TareaDTO[]> {
    return this.http.get<TareaDTO[]>(`${this.base}/mis-tareas`);
  }

  getByCurso(cursoId: number): Observable<TareaDTO[]> {
    return this.http.get<TareaDTO[]>(this.base, { params: { cursoId: cursoId.toString() } });
  }

  create(dto: TareaDTO): Observable<TareaDTO> {
    return this.http.post<TareaDTO>(this.base, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
