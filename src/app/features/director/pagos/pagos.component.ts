import { Component, OnInit, inject, signal, computed , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { MensualidadService, MensualidadDTO } from '../../../core/services/mensualidad.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

const MES_LABEL: Record<string, string> = {
  ENERO: 'Enero', FEBRERO: 'Febrero', MARZO: 'Marzo', ABRIL: 'Abril',
  MAYO: 'Mayo', JUNIO: 'Junio', JULIO: 'Julio', AGOSTO: 'Agosto',
  SEPTIEMBRE: 'Septiembre', OCTUBRE: 'Octubre', NOVIEMBRE: 'Noviembre', DICIEMBRE: 'Diciembre'
};

const MES_ORDEN: Record<string, number> = {
  ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
  JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12
};

interface EstudiantePagos {
  estudianteId: number;
  estudianteNombre: string;
  grado: number;
  nivel: string;
  matriculaId: number;
  mensualidades: MensualidadDTO[];
  pagadas: number;
  pendientes: number;
  totalPendiente: number;
  totalCobrado: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, TagModule,
    SkeletonModule, ToastModule, TooltipModule, DialogModule,
    ConfirmModalComponent
  ],
  providers: [MessageService],
  templateUrl: './pagos.component.html',
  styleUrl: './pagos.component.scss'
})
export class PagosComponent implements OnInit {
  private mensualidadService = inject(MensualidadService);
  private messageService = inject(MessageService);

  loading = signal(true);
  mensualidades = signal<MensualidadDTO[]>([]);
  showDetalle = false;
  showConfirm = false;
  confirmMsg = '';
  private pendingId: number | null = null;
  private _estudianteSeleccionado = signal<EstudiantePagos | null>(null);

  estudianteSeleccionado = computed(() => this._estudianteSeleccionado());

  estudiantesPagos = computed<EstudiantePagos[]>(() => {
    const map = new Map<number, EstudiantePagos>();
    for (const m of this.mensualidades()) {
      if (!map.has(m.estudianteId)) {
        map.set(m.estudianteId, {
          estudianteId: m.estudianteId,
          estudianteNombre: m.estudianteNombre,
          grado: m.grado,
          nivel: m.nivel,
          matriculaId: m.matriculaId,
          mensualidades: [],
          pagadas: 0,
          pendientes: 0,
          totalPendiente: 0,
          totalCobrado: 0
        });
      }
      const ep = map.get(m.estudianteId)!;
      ep.mensualidades.push(m);
      if (m.estadoPago === 'PAGADO') {
        ep.pagadas++;
        ep.totalCobrado += m.monto;
      } else {
        ep.pendientes++;
        ep.totalPendiente += m.monto;
      }
    }
    return [...map.values()].sort((a, b) => a.estudianteNombre.localeCompare(b.estudianteNombre));
  });

  totalPendientesGlobal = computed(() => this.mensualidades().filter(m => m.estadoPago === 'PENDIENTE').length);
  totalPagadasGlobal    = computed(() => this.mensualidades().filter(m => m.estadoPago === 'PAGADO').length);
  totalCobradoGlobal    = computed(() => this.mensualidades().filter(m => m.estadoPago === 'PAGADO').reduce((acc, m) => acc + m.monto, 0));
  totalPendienteMontoGlobal = computed(() => this.mensualidades().filter(m => m.estadoPago === 'PENDIENTE').reduce((acc, m) => acc + m.monto, 0));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.mensualidadService.getAll().subscribe({
      next: (data) => { this.mensualidades.set(data); this.loading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las mensualidades' });
        this.loading.set(false);
      }
    });
  }

  abrirDetalle(ep: EstudiantePagos) {
    this._estudianteSeleccionado.set(ep);
    this.showDetalle = true;
  }

  mensualidadesOrdenadas(ep: EstudiantePagos): MensualidadDTO[] {
    return [...ep.mensualidades].sort((a, b) => (MES_ORDEN[a.mes] ?? 0) - (MES_ORDEN[b.mes] ?? 0));
  }

  onPagar(m: MensualidadDTO) {
    this.pendingId = m.id;
    this.confirmMsg = `¿Registrar el pago de ${this.mesLabel(m.mes)} ${m.anio} de ${m.estudianteNombre}? Monto: S/ ${m.monto.toFixed(2)}`;
    this.showConfirm = true;
  }

  ejecutarPago() {
    if (!this.pendingId) return;
    this.mensualidadService.pagar(this.pendingId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Pagado', detail: 'Mensualidad registrada como pagada' });
        this.pendingId = null;
        this.showConfirm = false;
        this.load();
        this.showDetalle = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el pago' });
      }
    });
  }

  mesLabel(mes: string): string { return MES_LABEL[mes] ?? mes; }
  nivelLabel(nivel: string): string {
    return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel;
  }
  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
}
