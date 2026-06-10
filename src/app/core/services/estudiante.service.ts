import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioInfo } from '../models';

export interface EstudianteDTO {
  id: number;
  usuario?: UsuarioInfo;
  dni?: string;
  fechaNacimiento?: string;
  direccion?: string;
  telefono?: string;
  grado?: number;
  seccion?: string;
  nivel?: string;
}

export interface CalificacionDTO {
  id: number;
  estudianteId?: number;
  cursoId?: number;
  cursoNombre?: string;
  valor?: number;
  tipo?: string;
  fecha?: string;
  observaciones?: string;
  profesorId?: number;
}

export interface AsistenciaDTO {
  id: number;
  estudianteId?: number;
  cursoId?: number;
  cursoNombre?: string;
  fecha?: string;
  presente?: boolean;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class EstudianteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api`;

  getMiPerfil(): Observable<EstudianteDTO> {
    return this.http.get<EstudianteDTO>(`${this.base}/estudiantes/me`);
  }

  getMisNotas(): Observable<CalificacionDTO[]> {
    return this.http.get<CalificacionDTO[]>(`${this.base}/calificaciones/mis-notas`);
  }

  getMiAsistencia(): Observable<AsistenciaDTO[]> {
    return this.http.get<AsistenciaDTO[]>(`${this.base}/asistencias/mi-asistencia`);
  }

  getAll(): Observable<EstudianteDTO[]> {
    return this.http.get<EstudianteDTO[]>(`${this.base}/estudiantes`);
  }

  getByNivelAndGrado(nivel: string, grado: number, seccion?: string): Observable<EstudianteDTO[]> {
    const params: Record<string, string> = { nivel, grado: grado.toString() };
    if (seccion) params['seccion'] = seccion;
    return this.http.get<EstudianteDTO[]>(`${this.base}/estudiantes`, { params });
  }

  getById(id: number): Observable<EstudianteDTO> {
    return this.http.get<EstudianteDTO>(`${this.base}/estudiantes/${id}`);
  }

  getCalificaciones(estudianteId: number): Observable<CalificacionDTO[]> {
    return this.http.get<CalificacionDTO[]>(`${this.base}/calificaciones`, {
      params: { estudianteId: estudianteId.toString() }
    });
  }

  getCalificacionesByCurso(cursoId: number): Observable<CalificacionDTO[]> {
    return this.http.get<CalificacionDTO[]>(`${this.base}/calificaciones`, {
      params: { cursoId: cursoId.toString() }
    });
  }

  saveCalificacion(dto: Partial<CalificacionDTO>): Observable<CalificacionDTO> {
    return this.http.post<CalificacionDTO>(`${this.base}/calificaciones`, dto);
  }

  getAsistencias(estudianteId: number): Observable<AsistenciaDTO[]> {
    return this.http.get<AsistenciaDTO[]>(`${this.base}/asistencias`, {
      params: { estudianteId: estudianteId.toString() }
    });
  }

  getAsistenciasByCurso(cursoId: number): Observable<AsistenciaDTO[]> {
    return this.http.get<AsistenciaDTO[]>(`${this.base}/asistencias`, {
      params: { cursoId: cursoId.toString() }
    });
  }

  saveAsistenciasBatch(dtos: Array<Partial<AsistenciaDTO>>): Observable<AsistenciaDTO[]> {
    return this.http.post<AsistenciaDTO[]>(`${this.base}/asistencias/batch`, dtos);
  }
}
