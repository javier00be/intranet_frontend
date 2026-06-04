import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
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

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, TagModule,
    SkeletonModule, ToastModule, TooltipModule, SelectModule,
    ConfirmModalComponent
  ],
  providers: [MessageService],
  template: `
    <div class="page">
      <p-toast />

      <div class="page-header">
        <div>
          <h1 class="page-title">Mensualidades</h1>
          <p class="page-subtitle">{{ filtradasCount() }} cuota{{ filtradasCount() !== 1 ? 's' : '' }} · {{ pendientesCount() }} pendiente{{ pendientesCount() !== 1 ? 's' : '' }}</p>
        </div>
        <div class="header-filters">
          <p-select
            [options]="mesesOpciones"
            [(ngModel)]="mesFiltro"
            placeholder="Todos los meses"
            [showClear]="true"
            optionLabel="label"
            optionValue="value"
            styleClass="filter-drop" />
          <p-select
            [options]="estadoOpciones"
            [(ngModel)]="estadoFiltro"
            placeholder="Todos los estados"
            [showClear]="true"
            optionLabel="label"
            optionValue="value"
            styleClass="filter-drop" />
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Total cobrado</span>
          <span class="stat-value">S/ {{ totalCobrado() | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card warn">
          <span class="stat-label">Total pendiente</span>
          <span class="stat-value">S/ {{ totalPendiente() | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card neutral">
          <span class="stat-label">Cuotas pagadas</span>
          <span class="stat-value">{{ pagadasCount() }}</span>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-table">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row">
              <p-skeleton height="1rem" width="22%" />
              <p-skeleton height="1rem" width="10%" />
              <p-skeleton height="1rem" width="10%" />
              <p-skeleton height="1rem" width="10%" />
              <p-skeleton height="1rem" width="10%" />
            </div>
          }
        </div>
      } @else if (mensualidadesFiltradas().length === 0) {
        <div class="empty-state">
          <i class="pi pi-wallet"></i>
          <p>No hay mensualidades{{ mesFiltro || estadoFiltro ? ' con ese filtro' : ' registradas' }}.</p>
        </div>
      } @else {
        <div class="table-card">
          <p-table
            [value]="mensualidadesFiltradas()"
            [paginator]="true"
            [rows]="15"
            styleClass="p-datatable-striped"
            [tableStyle]="{'min-width': '52rem'}">
            <ng-template pTemplate="header">
              <tr>
                <th>Alumno</th>
                <th>Grado / Nivel</th>
                <th>Mes</th>
                <th>Monto</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-m>
              <tr>
                <td>
                  <div class="student-cell">
                    <div class="student-avatar">{{ initials(m.estudianteNombre) }}</div>
                    <span>{{ m.estudianteNombre }}</span>
                  </div>
                </td>
                <td>
                  <span class="grado-badge">{{ m.grado }}° {{ nivelLabel(m.nivel) }}</span>
                </td>
                <td class="mes-cell">{{ mesLabel(m.mes) }} {{ m.anio }}</td>
                <td class="monto-cell">S/ {{ m.monto | number:'1.2-2' }}</td>
                <td class="fecha-cell">
                  {{ m.fechaVencimiento | date:'dd/MM/yyyy' }}
                </td>
                <td>
                  <p-tag
                    [value]="m.estadoPago === 'PAGADO' ? 'Pagado' : 'Pendiente'"
                    [severity]="m.estadoPago === 'PAGADO' ? 'success' : 'warn'" />
                </td>
                <td>
                  @if (m.estadoPago === 'PENDIENTE') {
                    <button
                      class="action-btn pay"
                      (click)="onPagar(m)"
                      pTooltip="Registrar pago"
                      tooltipPosition="left">
                      <i class="pi pi-check-circle"></i>
                    </button>
                  } @else {
                    <span class="fecha-pago">{{ m.fechaPago | date:'dd/MM/yy' }}</span>
                  }
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" class="text-center p-4">No se encontraron mensualidades.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <app-confirm-modal
        [(visible)]="showConfirm"
        title="Registrar pago"
        [message]="confirmMsg"
        confirmLabel="Confirmar pago"
        (confirm)="ejecutarPago()"
        (cancel)="showConfirm = false" />
    </div>
  `,
  styles: [`
    .page { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; min-height: 100%; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.625rem; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #9ca3af; margin: 0.25rem 0 0; }

    .header-filters { display: flex; gap: 0.75rem; align-items: center; }
    ::ng-deep .filter-drop .p-select { border-radius: 10px; font-size: 0.875rem; }

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

    .grado-badge {
      display: inline-flex; align-items: center;
      background: #e0e7ff; color: #4338ca;
      font-size: 0.8125rem; font-weight: 600;
      padding: 0.25rem 0.75rem; border-radius: 20px;
    }

    .mes-cell { font-size: 0.875rem; font-weight: 600; color: #374151; }
    .monto-cell { font-size: 0.875rem; font-weight: 700; color: #111827; }
    .fecha-cell { font-size: 0.8125rem; color: #6b7280; }
    .fecha-pago { font-size: 0.8125rem; color: #10b981; font-weight: 500; }

    .action-btn {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 0.875rem; transition: all 0.15s;
    }
    .action-btn.pay { background: #d1fae5; color: #059669; }
    .action-btn.pay:hover { background: #059669; color: white; }

    .skeleton-table { background: white; border: 1px solid #f3f4f6; border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; }
    .skeleton-row { display: flex; align-items: center; gap: 1.5rem; padding: 0.5rem 0; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; color: #e5e7eb; }
    .empty-state p { font-size: 0.9375rem; color: #9ca3af; margin: 0; }

    .text-center { text-align: center; }
    .p-4 { padding: 1rem; }

    :host-context(.dark-mode) .page-title { color: #f9fafb; }
    :host-context(.dark-mode) .stat-card { background: #1e293b; border-color: #334155; }
    :host-context(.dark-mode) .stat-value { color: #f1f5f9; }
    :host-context(.dark-mode) .table-card { background: #1e293b; border-color: #334155; }
    :host-context(.dark-mode) .monto-cell { color: #f1f5f9; }
    :host-context(.dark-mode) .mes-cell { color: #e2e8f0; }
  `]
})
export class PagosComponent implements OnInit {
  private mensualidadService = inject(MensualidadService);
  private messageService = inject(MessageService);

  loading = signal(true);
  mensualidades = signal<MensualidadDTO[]>([]);
  mesFiltro: string | null = null;
  estadoFiltro: string | null = null;
  showConfirm = false;
  confirmMsg = '';
  private pendingId: number | null = null;

  mesesOpciones = Object.entries(MES_LABEL).map(([value, label]) => ({ value, label }));
  estadoOpciones = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'PAGADO',    label: 'Pagado'    }
  ];

  mensualidadesFiltradas = computed(() => {
    let lista = this.mensualidades();
    if (this.mesFiltro)    lista = lista.filter(m => m.mes === this.mesFiltro);
    if (this.estadoFiltro) lista = lista.filter(m => m.estadoPago === this.estadoFiltro);
    return lista.sort((a, b) => {
      const mesA = MES_ORDEN[a.mes] ?? 0;
      const mesB = MES_ORDEN[b.mes] ?? 0;
      return a.estudianteNombre.localeCompare(b.estudianteNombre) || mesA - mesB;
    });
  });

  filtradasCount = computed(() => this.mensualidadesFiltradas().length);
  pendientesCount = computed(() => this.mensualidades().filter(m => m.estadoPago === 'PENDIENTE').length);
  pagadasCount    = computed(() => this.mensualidades().filter(m => m.estadoPago === 'PAGADO').length);

  totalCobrado   = computed(() => this.mensualidades().filter(m => m.estadoPago === 'PAGADO').reduce((acc, m) => acc + m.monto, 0));
  totalPendiente = computed(() => this.mensualidades().filter(m => m.estadoPago === 'PENDIENTE').reduce((acc, m) => acc + m.monto, 0));

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
        this.load();
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
