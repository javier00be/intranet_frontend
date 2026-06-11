import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { forkJoin } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EventoCalendarioService, EventoCalendario } from '../../../core/services/evento-calendario.service';
import { TareaService, TareaDTO } from '../../../core/services/tarea.service';

interface DetalleEvento {
  tipo: 'evento' | 'tarea';
  titulo: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
  cursoNombre?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estudiante-calendario',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, ToastModule, ButtonModule, TagModule, ModalComponent],
  providers: [MessageService],
  templateUrl: './estudiante-calendario.component.html',
  styleUrl:    './estudiante-calendario.component.scss'
})
export class EstudianteCalendarioComponent implements OnInit {
  private eventoService = inject(EventoCalendarioService);
  private tareaService  = inject(TareaService);
  private cdr           = inject(ChangeDetectorRef);

  loading        = signal(true);
  showDetail     = false;
  selectedDetalle: DetalleEvento | null = null;

  calendarOptions = signal<CalendarOptions>({
    plugins:      [dayGridPlugin, timeGridPlugin, listPlugin],
    locale:       esLocale,
    initialView:  'dayGridMonth',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'dayGridMonth,timeGridWeek,listWeek'
    },
    editable:    false,
    selectable:  false,
    dayMaxEvents: true,
    events:      [],
    eventClick:  (arg) => this.onEventClick(arg),
  });

  ngOnInit() {
    forkJoin({
      eventos: this.eventoService.getAll(),
      tareas:  this.tareaService.getMisTareas()
    }).subscribe({
      next: ({ eventos, tareas }) => {
        const fcEvents: EventInput[] = [
          ...eventos.map(this.eventoToFc),
          ...tareas.filter(t => !!t.fechaEntrega).map(this.tareaToFc)
        ];
        this.calendarOptions.update(opts => ({ ...opts, events: fcEvents }));
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.loading.set(false)
    });
  }

  onEventClick(arg: EventClickArg) {
    const e = arg.event;
    this.selectedDetalle = {
      tipo:        e.extendedProps['tipo'],
      titulo:      e.title,
      descripcion: e.extendedProps['descripcion'],
      fechaInicio: e.startStr,
      fechaFin:    e.endStr || undefined,
      cursoNombre: e.extendedProps['cursoNombre']
    };
    this.showDetail = true;
    this.cdr.markForCheck();
  }

  private eventoToFc(e: EventoCalendario): EventInput {
    return {
      id:              `ev-${e.id}`,
      title:           e.titulo,
      start:           e.fechaInicio,
      end:             e.fechaFin,
      backgroundColor: e.color ?? '#6366f1',
      borderColor:     e.color ?? '#6366f1',
      extendedProps:   { tipo: 'evento', descripcion: e.descripcion }
    };
  }

  private tareaToFc(t: TareaDTO): EventInput {
    return {
      id:              `tarea-${t.id}`,
      title:           `📚 ${t.titulo}`,
      start:           t.fechaEntrega!,
      backgroundColor: '#f59e0b',
      borderColor:     '#f59e0b',
      textColor:       '#000',
      extendedProps:   { tipo: 'tarea', descripcion: t.descripcion, cursoNombre: t.cursoNombre }
    };
  }
}
