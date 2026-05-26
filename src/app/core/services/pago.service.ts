import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Pago {
  id?: number;
  estudianteId: number;
  monto: number;
  concepto: string;
  fechaPago?: string;
  estado: string;
  metodoPago?: string;
}

@Injectable({ providedIn: 'root' })
export class PagoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/pagos`;

  getAll(): Observable<Pago[]> {
    return this.http.get<Pago[]>(this.apiUrl);
  }

  getByEstudiante(estudianteId: number): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/estudiante/${estudianteId}`);
  }

  create(pago: Pago): Observable<Pago> {
    return this.http.post<Pago>(this.apiUrl, pago);
  }
}
