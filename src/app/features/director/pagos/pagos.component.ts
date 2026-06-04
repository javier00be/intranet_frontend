import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, TagModule,
    SkeletonModule, ToastModule, TooltipModule, DialogModule,
    ConfirmModalComponent
  ],
  providers: [MessageService],
  template: `
    <div class="page">
      <p-toast />

      <div class="page-header">
        <div>
          <h1 class="page-title">Mensualidades</h1>
          <p class="page-subtitle">{{ estudiantesPagos().length }} alumno{{ estudiantesPagos().length !== 1 ? 's' : '' }} · {{ totalPendientesGlobal() }} cuota{{ totalPendientesGlobal() !== 1 ? 's' : '' }} pendiente{{ totalPendientesGlobal() !== 1 ? 's' : '' }}</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Total cobrado</span>
          <span class="stat-value">S/ {{ totalCobradoGlobal() | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card warn">
          <span class="stat-label">Total pendiente</span>
          <span class="stat-value">S/ {{ totalPendienteMontoGlobal() | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card neutral">
          <span class="stat-label">Cuotas pagadas</span>
          <span class="stat-value">{{ totalPagadasGlobal() }}</span>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-table">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row">
              <p-skeleton height="1rem" width="25%" />
              <p-skeleton height="1rem" width="10%" />
              <p-skeleton height="1rem" width="12%" />
              <p-skeleton height="1rem" width="12%" />
              <p-skeleton height="1rem" width="8%" />
            </div>
          }
        </div>
      } @else if (estudiantesPagos().length === 0) {
        <div class="empty-state">
          <i class="pi pi-wallet"></i>
          <p>No hay mensualidades registradas.</p>
        </div>
      } @else {
        <div class="table-card">
          <p-table
            [value]="estudiantesPagos()"
            [paginator]="true"
            [rows]="15"
            styleClass="p-datatable-striped"
            [tableStyle]="{'min-width': '52rem'}">
            <ng-template pTemplate="header">
              <tr>
                <th>Alumno</th>
                <th>Grado / Nivel</th>
                <th>Pagadas</th>
                <th>Pendientes</th>
                <th>Monto pendiente</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ep>
              <tr>
                <td>
                  <div class="student-cell">
                    <div class="student-avatar">{{ initials(ep.estudianteNombre) }}</div>
                    <span>{{ ep.estudianteNombre }}</span>
                  </div>
                </td>
                <td>
                  <span class="grado-badge">{{ ep.grado }}° {{ nivelLabel(ep.nivel) }}</span>
                </td>
                <td>
                  <span class="count-badge pagado">{{ ep.pagadas }} / 10</span>
                </td>
                <td>
                  <span class="count-badge" [class.pendiente]="ep.pendientes > 0" [class.ok]="ep.pendientes === 0">
                    {{ ep.pendientes }}
                  </span>
                </td>
                <td class="monto-cell">S/ {{ ep.totalPendiente | number:'1.2-2' }}</td>
                <td>
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    (click)="abrirDetalle(ep)"
                    pTooltip="Ver mensualidades"
                    tooltipPosition="left" />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>

    <!-- Modal detalle de mensualidades por alumno -->
    <p-dialog
      [(visible)]="showDetalle"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="detalle-dialog"
      [style]="{width: '640px'}">
      <ng-template pTemplate="header">
        <div class="dialog-header">
          <div class="student-avatar large">{{ initials(estudianteSeleccionado()?.estudianteNombre ?? '') }}</div>
          <div>
            <div class="dialog-title">{{ estudianteSeleccionado()?.estudianteNombre }}</div>
            <div class="dialog-subtitle">{{ estudianteSeleccionado()?.grado }}° {{ nivelLabel(estudianteSeleccionado()?.nivel ?? '') }}</div>
          </div>
        </div>
      </ng-template>

      <div class="dialog-body">
        @if (estudianteSeleccionado(); as ep) {
          <div class="mensualidades-list">
            @for (m of mensualidadesOrdenadas(ep); track m.id) {
              <div class="mensualidad-row" [class.pagada]="m.estadoPago === 'PAGADO'">
                <div class="mes-info">
                  <span class="mes-nombre">{{ mesLabel(m.mes) }}</span>
                  <span class="vencimiento">Vence {{ m.fechaVencimiento | date:'dd/MM/yyyy' }}</span>
                </div>
                <span class="mes-monto">S/ {{ m.monto | number:'1.2-2' }}</span>
                <div class="mes-estado">
                  @if (m.estadoPago === 'PAGADO') {
                    <div class="estado-pagado">
                      <p-tag severity="success" icon="pi pi-check" [value]="(m.fechaPago | date:'dd/MM/yy') ?? 'Pagado'" />
                    </div>
                  } @else {
                    <p-button
                      label="Registrar pago"
                      icon="pi pi-credit-card"
                      size="small"
                      (click)="onPagar(m)" />
                  }
                </div>
              </div>
            }
          </div>

          <div class="dialog-resumen">
            <div class="resumen-item">
              <span class="resumen-label">Cobrado</span>
              <span class="resumen-val cobrado">S/ {{ ep.totalCobrado | number:'1.2-2' }}</span>
            </div>
            <div class="resumen-divider"></div>
            <div class="resumen-item">
              <span class="resumen-label">Pendiente</span>
              <span class="resumen-val pendiente">S/ {{ ep.totalPendiente | number:'1.2-2' }}</span>
            </div>
          </div>
        }
      </div>
    </p-dialog>

    <app-confirm-modal
      [(visible)]="showConfirm"
      title="Registrar pago"
      [message]="confirmMsg"
      confirmLabel="Confirmar pago"
      (confirm)="ejecutarPago()"
      (cancel)="showConfirm = false" />
  `,
  styles: [`
    .page { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; min-height: 100%; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.625rem; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #9ca3af; margin: 0.25rem 0 0; }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .stat-card {
      background: white; border: 1px solid #e0e7ff; border-radius: 14px;
      padding: 1.125rem 1.375rem; display: flex; flex-direction: column; gap: 0.25rem;
      border-left: 4px solid #6366f1;
    }
    .stat-card.warn { border-left-color: #f59e0b; }
    .stat-card.neutral { border-left-color: #10b981; }
    .stat-label { font-size: 0.8125rem; color: #6b7280; }
    .stat-value { font-size: 1.375rem; font-weight: 700; color: #111827; }

    .table-card { background: white; border: 1px solid #f3f4f6; border-radius: 14px; overflow: hidden; }

    .student-cell { display: flex; align-items: center; gap: 0.75rem; }
    .student-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: #e0e7ff; color: #6366f1;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }
    .student-avatar.large { width: 42px; height: 42px; font-size: 0.9rem; }

    .grado-badge {
      display: inline-flex; align-items: center;
      background: #e0e7ff; color: #4338ca;
      font-size: 0.8125rem; font-weight: 600;
      padding: 0.25rem 0.75rem; border-radius: 20px;
    }

    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.8125rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px;
      background: #f3f4f6; color: #6b7280;
    }
    .count-badge.pagado { background: #d1fae5; color: #059669; }
    .count-badge.pendiente { background: #fef3c7; color: #d97706; }
    .count-badge.ok { background: #d1fae5; color: #059669; }

    .monto-cell { font-size: 0.875rem; font-weight: 700; color: #111827; }

    .skeleton-table { background: white; border: 1px solid #f3f4f6; border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; }
    .skeleton-row { display: flex; align-items: center; gap: 1.5rem; padding: 0.5rem 0; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; color: #e5e7eb; }
    .empty-state p { font-size: 0.9375rem; color: #9ca3af; margin: 0; }

    /* Dialog */
    .dialog-header { display: flex; align-items: center; gap: 0.875rem; }
    .dialog-title { font-size: 1.0625rem; font-weight: 700; color: #111827; }
    .dialog-subtitle { font-size: 0.8125rem; color: #9ca3af; margin-top: 0.1rem; }

    .dialog-body { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.25rem 0; }

    .mensualidades-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .mensualidad-row {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.75rem 1rem; border-radius: 10px;
      background: #f9fafb; border: 1px solid #f3f4f6;
      transition: background 0.15s;
    }
    .mensualidad-row.pagada { background: #f0fdf4; border-color: #bbf7d0; }

    .mes-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .mes-nombre { font-size: 0.9375rem; font-weight: 600; color: #111827; }
    .vencimiento { font-size: 0.75rem; color: #9ca3af; margin-top: 0.1rem; }

    .mes-monto { font-size: 0.9375rem; font-weight: 700; color: #374151; white-space: nowrap; }

    .mes-estado { display: flex; align-items: center; justify-content: flex-end; min-width: 140px; }

    .estado-pagado { display: flex; align-items: center; }

    .dialog-resumen {
      display: flex; align-items: center; gap: 1.5rem;
      padding: 0.875rem 1rem; border-radius: 10px;
      background: white; border: 1px solid #e5e7eb;
    }
    .resumen-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .resumen-label { font-size: 0.75rem; color: #9ca3af; }
    .resumen-val { font-size: 1.0625rem; font-weight: 700; }
    .resumen-val.cobrado { color: #059669; }
    .resumen-val.pendiente { color: #d97706; }
    .resumen-divider { width: 1px; height: 36px; background: #e5e7eb; }

    :host-context(.dark-mode) .page-title { color: #f9fafb; }
    :host-context(.dark-mode) .stat-card { background: #1e293b; border-color: #334155; }
    :host-context(.dark-mode) .stat-value { color: #f1f5f9; }
    :host-context(.dark-mode) .table-card { background: #1e293b; border-color: #334155; }
    :host-context(.dark-mode) .monto-cell { color: #f1f5f9; }
    :host-context(.dark-mode) .mensualidad-row { background: #1e293b; border-color: #334155; }
    :host-context(.dark-mode) .mes-nombre { color: #f1f5f9; }
  `]
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
