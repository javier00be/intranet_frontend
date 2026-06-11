import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EventoCalendario {
  id?: number;
  titulo: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class EventoCalendarioService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/eventos`;

  getAll(): Observable<EventoCalendario[]> {
    return this.http.get<EventoCalendario[]>(this.apiUrl);
  }

  create(evento: EventoCalendario): Observable<EventoCalendario> {
    return this.http.post<EventoCalendario>(this.apiUrl, evento);
  }

  update(id: number, evento: EventoCalendario): Observable<EventoCalendario> {
    return this.http.put<EventoCalendario>(`${this.apiUrl}/${id}`, evento);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
