import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DniData {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  numeroDocumento: string;
}

@Injectable({ providedIn: 'root' })
export class DniService {
  private http = inject(HttpClient);

  buscar(dni: string): Observable<DniData> {
    return this.http.get<DniData>(`${environment.apiUrl}/api/reniec/dni/${dni}`).pipe(
      catchError(err => {
        const msg = err.status === 404
          ? 'DNI no encontrado en RENIEC'
          : 'Error al consultar el DNI';
        return throwError(() => new Error(msg));
      })
    );
  }

  toTitleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}
