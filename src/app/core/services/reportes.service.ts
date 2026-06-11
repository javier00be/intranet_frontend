import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GradoPromedio  { label: string; promedio: number; }
export interface AsistenciaMes  { mes: string; porcentaje: number; }
export interface AlertaEstudiante { nombre: string; grado: string; promedio: number; }

export interface ReportesDTO {
  rendimientoGrado:  GradoPromedio[];
  pagosPagados:      number;
  pagosPendientes:   number;
  pagosVencidos:     number;
  asistenciaMensual: AsistenciaMes[];
  alertas:           AlertaEstudiante[];
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/reportes`;

  getReportes(): Observable<ReportesDTO> {
    return this.http.get<ReportesDTO>(this.apiUrl);
  }
}
