import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EventoCalendarioService, EventoCalendario } from '../../../core/services/evento-calendario.service';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profesor-calendario',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, ToastModule, ButtonModule, ModalComponent],
  providers: [MessageService],
  templateUrl: './calendario.component.html',
  styleUrl:    './calendario.component.scss'
})
export class CalendarioComponent implements OnInit {
  private eventoService = inject(EventoCalendarioService);
  private cdr           = inject(ChangeDetectorRef);

  loading        = signal(true);
  showDetail     = false;
  selectedEvento: EventoCalendario | null = null;

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

  onEventClick(arg: EventClickArg) {
    const e = arg.event;
    this.selectedEvento = {
      id:           Number(e.id),
      titulo:       e.title,
      descripcion:  e.extendedProps['descripcion'],
      fechaInicio:  e.startStr,
      fechaFin:     e.endStr,
      color:        e.backgroundColor
    };
    this.showDetail = true;
    this.cdr.markForCheck();
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
}
