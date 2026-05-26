import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardData {
  totalEstudiantes: number;
  totalProfesores: number;
  totalCursos: number;
  pagosPendientes: number;
  misCursos: number;
  misTareas: number;
  misAlumnos: number;
  misNotas: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/dashboard`;

  get(role: string, userId: number): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl, {
      params: { role: role.toUpperCase(), userId: userId.toString() }
    });
  }
}
