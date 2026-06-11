import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { EventoCalendarioService, EventoCalendario } from '../../../core/services/evento-calendario.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-director-calendario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, FullCalendarModule,
    ButtonModule, InputTextModule, TextareaModule,
    ToastModule, ModalComponent, ConfirmModalComponent
  ],
  providers: [MessageService],
  templateUrl: './director-calendario.component.html',
  styleUrl:    './director-calendario.component.scss'
})
export class DirectorCalendarioComponent implements OnInit {
  private eventoService  = inject(EventoCalendarioService);
  private messageService = inject(MessageService);
  private cdr            = inject(ChangeDetectorRef);

  loading      = signal(true);
  showModal    = false;
  showConfirm  = false;
  editingId: number | null = null;
  pendingDeleteId: number | null = null;

  form: Omit<EventoCalendario, 'id'> = this.emptyForm();

  calendarOptions = signal<CalendarOptions>({
    plugins:      [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    locale:       esLocale,
    initialView:  'dayGridMonth',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'dayGridMonth,timeGridWeek,listWeek'
    },
    selectable:      true,
    selectMirror:    true,
    editable:        false,
    dayMaxEvents:    true,
    events:          [],
    select:          (arg) => this.onDateSelect(arg),
    eventClick:      (arg) => this.onEventClick(arg),
  });

  ngOnInit() { this.loadEventos(); }

  loadEventos() {
    this.eventoService.getAll().subscribe({
      next: (eventos) => {
        this.calendarOptions.update(opts => ({
          ...opts,
          events: eventos.map(this.toFcEvent)
        }));
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.loading.set(false)
    });
  }

  onDateSelect(arg: DateSelectArg) {
    this.form = this.emptyForm();
    this.form.fechaInicio = arg.startStr;
    this.form.fechaFin    = arg.endStr ?? arg.startStr;
    this.editingId        = null;
    this.showModal        = true;
    this.cdr.markForCheck();
  }

  onEventClick(arg: EventClickArg) {
    const e = arg.event;
    this.editingId        = Number(e.id);
    this.form.titulo      = e.title;
    this.form.descripcion = e.extendedProps['descripcion'] ?? '';
    this.form.fechaInicio = e.startStr;
    this.form.fechaFin    = e.endStr ?? e.startStr;
    this.form.color       = e.backgroundColor || '#6366f1';
    this.showModal        = true;
    this.cdr.markForCheck();
  }

  save() {
    if (!this.form.titulo?.trim()) return;
    const payload: EventoCalendario = { ...this.form };
    const op = this.editingId
      ? this.eventoService.update(this.editingId, payload)
      : this.eventoService.create(payload);

    op.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito',
          detail: this.editingId ? 'Evento actualizado' : 'Evento creado' });
        this.showModal = false;
        this.loadEventos();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el evento' })
    });
  }

  confirmDelete() {
    if (this.editingId) {
      this.pendingDeleteId = this.editingId;
      this.showModal       = false;
      this.showConfirm     = true;
      this.cdr.markForCheck();
    }
  }

  executeDelete() {
    if (!this.pendingDeleteId) return;
    this.eventoService.delete(this.pendingDeleteId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Evento eliminado' });
        this.pendingDeleteId = null;
        this.loadEventos();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
    });
  }

  private toFcEvent(e: EventoCalendario): EventInput {
    return {
      id:              String(e.id),
      title:           e.titulo,
      start:           e.fechaInicio,
      end:             e.fechaFin,
      backgroundColor: e.color ?? '#6366f1',
      borderColor:     e.color ?? '#6366f1',
      extendedProps:   { descripcion: e.descripcion }
    };
  }

  private emptyForm(): Omit<EventoCalendario, 'id'> {
    return { titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', color: '#6366f1' };
  }
}
