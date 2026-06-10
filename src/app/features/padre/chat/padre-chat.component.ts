import { Component, OnInit, inject, signal, ElementRef, ViewChild, AfterViewChecked , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ChatService, ConversacionDTO, MensajeDTO } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProfesorService, Profesor } from '../../../core/services/profesor.service';
import { forkJoin } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-padre-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, AvatarModule, SkeletonModule, ToastModule, InputTextModule],
  providers: [MessageService],
  templateUrl: './padre-chat.component.html',
  styleUrl: './padre-chat.component.scss'
})
export class PadreChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;

  private chatService    = inject(ChatService);
  private profesorService = inject(ProfesorService);
  private messageService  = inject(MessageService);
  authService = inject(AuthService);

  loading       = signal(true);
  conversaciones = signal<ConversacionDTO[]>([]);
  profesores     = signal<Profesor[]>([]);
  selected       = signal<ConversacionDTO | null>(null);
  mensajes       = signal<MensajeDTO[]>([]);
  loadingMsgs    = signal(false);
  sending        = signal(false);
  nuevoMensaje   = '';
  showNewChat    = false;

  private shouldScroll = false;

  ngOnInit() {
    forkJoin({
      conversaciones: this.chatService.getConversaciones(),
      profesores: this.profesorService.getAll()
    }).subscribe({
      next: ({ conversaciones, profesores }) => {
        this.conversaciones.set(conversaciones);
        this.profesores.set(profesores);
        if (conversaciones.length) this.selectConversacion(conversaciones[0]);
        this.loading.set(false);
      },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el chat' }); this.loading.set(false); }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  selectConversacion(c: ConversacionDTO) {
    this.selected.set(c);
    this.loadingMsgs.set(true);
    this.chatService.getMensajes(c.id).subscribe({
      next: msgs => { this.mensajes.set(msgs); this.loadingMsgs.set(false); this.shouldScroll = true; },
      error: () => this.loadingMsgs.set(false)
    });
  }

  iniciarConProfesor(profe: Profesor) {
    if (!profe.usuario?.id) return;
    this.chatService.iniciarConversacion(profe.usuario.id!).subscribe({
      next: conv => {
        const existe = this.conversaciones().find(c => c.id === conv.id);
        if (!existe) this.conversaciones.update(list => [conv, ...list]);
        this.selectConversacion(conv);
        this.showNewChat = false;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo iniciar la conversación' })
    });
  }

  send() {
    const conv = this.selected();
    const texto = this.nuevoMensaje.trim();
    if (!conv || !texto || this.sending()) return;

    const userId = this.authService.user()?.id;
    const receptorId = conv.participante1?.id === userId ? conv.participante2?.id : conv.participante1?.id;
    if (!receptorId) return;

    this.sending.set(true);
    this.chatService.enviarMensaje(receptorId, texto).subscribe({
      next: msg => {
        this.mensajes.update(list => [...list, msg]);
        this.nuevoMensaje = '';
        this.sending.set(false);
        this.shouldScroll = true;
      },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar' }); this.sending.set(false); }
    });
  }

  otroParticipante(c: ConversacionDTO): string {
    const userId = this.authService.user()?.id;
    const otro = c.participante1?.id === userId ? c.participante2 : c.participante1;
    return `${otro?.nombre ?? ''} ${otro?.apellido ?? ''}`.trim() || 'Desconocido';
  }

  iniciales(nombre: string): string {
    const parts = nombre.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  isMine(msg: MensajeDTO): boolean {
    return msg.emisorId === this.authService.user()?.id;
  }
}
