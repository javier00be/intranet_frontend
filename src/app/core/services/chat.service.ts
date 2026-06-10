import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioInfo } from '../models';

export interface ConversacionDTO {
  id: number;
  participante1?: UsuarioInfo;
  participante2?: UsuarioInfo;
  creadoEn?: string;
}

export interface MensajeDTO {
  id: number;
  conversacionId: number;
  emisorId?: number;
  emisorNombre?: string;
  contenido?: string;
  enviadoEn?: string;
  leido?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/chat`;

  getConversaciones(): Observable<ConversacionDTO[]> {
    return this.http.get<ConversacionDTO[]>(`${this.base}/conversaciones`);
  }

  getMensajes(conversacionId: number): Observable<MensajeDTO[]> {
    return this.http.get<MensajeDTO[]>(`${this.base}/conversaciones/${conversacionId}/mensajes`);
  }

  iniciarConversacion(receptorId: number): Observable<ConversacionDTO> {
    return this.http.post<ConversacionDTO>(`${this.base}/conversaciones`, { receptorId });
  }

  enviarMensaje(receptorId: number, contenido: string): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.base}/mensajes/send`, { receptorId, contenido });
  }
}
