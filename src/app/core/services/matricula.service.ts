import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AlumnoMatriculaRequest {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  dni: string;
  email: string;
  password: string;
  fechaNacimiento?: string;
  grado: number | null;
  seccion: string;
  nivel: string;
  anio: number;
  montoMatricula: number | null;
  montoMensualidad: number | null;
}

export interface MatriculaCreateRequest {
  padreNombre: string;
  padreApellidoPaterno: string;
  padreApellidoMaterno: string;
  padreDni: string;
  padreEmail: string;
  padrePassword: string;
  padreTelefono: string;
  diaPago: number;
  alumnos: AlumnoMatriculaRequest[];
}

export interface MatriculaDTO {
  id: number;
  anio: number;
  grado: number;
  nivel: string;
  estado: string;
  estadoPago: string;
  montoMatricula: number;
  montoMensualidad: number;
  fechaCreacion: string;
  estudianteId: number;
  estudianteNombre: string;
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/matriculas`;

  getAll(): Observable<MatriculaDTO[]> {
    return this.http.get<MatriculaDTO[]>(this.apiUrl);
  }

  getMiMatricula(): Observable<MatriculaDTO> {
    return this.http.get<MatriculaDTO>(`${this.apiUrl}/mi-matricula`);
  }

  crear(request: MatriculaCreateRequest): Observable<MatriculaDTO[]> {
    return this.http.post<MatriculaDTO[]>(this.apiUrl, request);
  }

  pagar(id: number): Observable<MatriculaDTO> {
    return this.http.patch<MatriculaDTO>(`${this.apiUrl}/${id}/pagar`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
