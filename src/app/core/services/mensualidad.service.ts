import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MensualidadDTO {
  id: number;
  matriculaId: number;
  estudianteId: number;
  estudianteNombre: string;
  grado: number;
  nivel: string;
  mes: string;
  anio: number;
  monto: number;
  estadoPago: string;
  fechaVencimiento: string;
  fechaPago?: string;
  comprobanteUrl?: string;
  nroTransaccion?: string;
}

@Injectable({ providedIn: 'root' })
export class MensualidadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/mensualidades`;

  getAll(): Observable<MensualidadDTO[]> {
    return this.http.get<MensualidadDTO[]>(this.apiUrl);
  }

  getByMatricula(matriculaId: number): Observable<MensualidadDTO[]> {
    return this.http.get<MensualidadDTO[]>(`${this.apiUrl}/matricula/${matriculaId}`);
  }

  getByEstudiante(estudianteId: number): Observable<MensualidadDTO[]> {
    return this.http.get<MensualidadDTO[]>(`${this.apiUrl}/estudiante/${estudianteId}`);
  }

  pagar(id: number): Observable<MensualidadDTO> {
    return this.http.patch<MensualidadDTO>(`${this.apiUrl}/${id}/pagar`, {});
  }

  subirComprobante(id: number, nroTransaccion: string, url?: string): Observable<MensualidadDTO> {
    return this.http.patch<MensualidadDTO>(`${this.apiUrl}/${id}/comprobante`, { nroTransaccion, url });
  }

  validarPago(id: number): Observable<MensualidadDTO> {
    return this.http.patch<MensualidadDTO>(`${this.apiUrl}/${id}/validar`, {});
  }
}
