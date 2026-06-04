import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { MatriculaService, MatriculaDTO } from '../../../core/services/matricula.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { MatriculaFormComponent } from '../../../shared/components/matricula-form/matricula-form.component';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [
    CommonModule, TableModule, ButtonModule, TagModule,
    SkeletonModule, ToastModule, TooltipModule,
    ModalComponent, ConfirmModalComponent, MatriculaFormComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="page">
      <p-toast />

      <div class="page-header">
        <div>
          <h1 class="page-title">Matrículas</h1>
          <p class="page-subtitle">{{ matriculas().length }} alumno{{ matriculas().length !== 1 ? 's' : '' }} matriculado{{ matriculas().length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-primary" (click)="showForm = true">
          <i class="pi pi-plus"></i> Nueva matrícula
        </button>
      </div>

      @if (loading()) {
        <div class="skeleton-table">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row">
              <p-skeleton height="1rem" width="25%" />
              <p-skeleton height="1rem" width="12%" />
              <p-skeleton height="1rem" width="10%" />
              <p-skeleton height="1rem" width="10%" />
              <p-skeleton height="1rem" width="10%" />
            </div>
          }
        </div>
      } @else if (matriculas().length === 0) {
        <div class="empty-state">
          <i class="pi pi-graduation-cap"></i>
          <p>No hay alumnos matriculados todavía.</p>
          <button class="btn-ghost" (click)="showForm = true">Registrar el primero</button>
        </div>
      } @else {
        <div class="table-card">
          <p-table
            [value]="matriculas()"
            [paginator]="true"
            [rows]="15"
            styleClass="p-datatable-striped"
            [tableStyle]="{'min-width': '48rem'}">
            <ng-template pTemplate="header">
              <tr>
                <th>Alumno</th>
                <th>Grado / Nivel</th>
                <th>Matrícula</th>
                <th>Mensualidad</th>
                <th>Año</th>
                <th>Pago</th>
                <th>Fecha registro</th>
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
                <td class="monto-cell">S/ {{ m.montoMatricula | number:'1.2-2' }}</td>
                <td class="monto-cell">S/ {{ m.montoMensualidad | number:'1.2-2' }}</td>
                <td>{{ m.anio }}</td>
                <td>
                  <p-tag
                    [value]="m.estadoPago === 'PAGADO' ? 'Pagado' : 'Pendiente'"
                    [severity]="m.estadoPago === 'PAGADO' ? 'success' : 'warn'" />
                </td>
                <td class="fecha-cell">{{ m.fechaCreacion | date:'dd/MM/yyyy' }}</td>
                <td>
                  <div class="row-actions">
                    @if (m.estadoPago === 'PENDIENTE') {
                      <button class="action-btn pay" (click)="onPagarMatricula(m)"
                        pTooltip="Registrar pago de matrícula" tooltipPosition="top">
                        <i class="pi pi-check-circle"></i>
                      </button>
                    }
                    <button class="action-btn" (click)="verDetalle(m)"
                      pTooltip="Ver detalle" tooltipPosition="top">
                      <i class="pi pi-eye"></i>
                    </button>
                    <button class="action-btn danger" (click)="onDelete(m)"
                      pTooltip="Eliminar" tooltipPosition="top">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="8" class="text-center p-8">No se encontraron matrículas.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <!-- Modal formulario -->
      <app-modal
        [(visible)]="showForm"
        title="Nueva Matrícula"
        subtitle="Registrá al padre o tutor y sus hijos"
        width="900px">
        @if (showForm) {
          <app-matricula-form
            (save)="onSaved($event)"
            (cancel)="showForm = false" />
        }
      </app-modal>

      <!-- Modal detalle -->
      <app-modal
        [(visible)]="showDetalle"
        [title]="detalle?.estudianteNombre ?? ''"
        [subtitle]="detalle ? (detalle.grado + '° ' + nivelLabel(detalle.nivel) + ' · ' + detalle.anio) : ''"
        width="480px">
        @if (showDetalle && detalle) {
          <div class="detalle-body">
            <div class="detalle-row">
              <span class="detalle-lbl">Estado matrícula</span>
              <p-tag value="ACTIVA" severity="success" />
            </div>
            <div class="detalle-row">
              <span class="detalle-lbl">Estado de pago</span>
              <p-tag
                [value]="detalle.estadoPago === 'PAGADO' ? 'Pagado' : 'Pendiente'"
                [severity]="detalle.estadoPago === 'PAGADO' ? 'success' : 'warn'" />
            </div>
            <div class="detalle-divider"></div>
            <div class="detalle-row">
              <span class="detalle-lbl">Monto matrícula</span>
              <span class="detalle-monto">S/ {{ detalle.montoMatricula | number:'1.2-2' }}</span>
            </div>
            <div class="detalle-row">
              <span class="detalle-lbl">Monto mensualidad</span>
              <span class="detalle-monto">S/ {{ detalle.montoMensualidad | number:'1.2-2' }}</span>
            </div>
            <div class="detalle-divider"></div>
            <div class="detalle-row">
              <span class="detalle-lbl">Fecha de registro</span>
              <span class="detalle-val">{{ detalle.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="detalle-hint">
              <i class="pi pi-info-circle"></i>
              Los cursos se asignan automáticamente según el grado y nivel del alumno.
            </div>
          </div>
        }
      </app-modal>

      <!-- Confirmar pago matrícula -->
      <app-confirm-modal
        [(visible)]="showConfirmPago"
        title="Registrar pago de matrícula"
        [message]="'¿Confirmar el pago de la matrícula de ' + (pendingPago?.estudianteNombre ?? '') + '? Se generarán las mensualidades del año escolar.'"
        confirmLabel="Confirmar pago"
        (confirm)="executePago()"
        (cancel)="showConfirmPago = false" />

      <!-- Confirmar eliminación -->
      <app-confirm-modal
        [(visible)]="showConfirm"
        title="Eliminar matrícula"
        [message]="'¿Eliminar la matrícula de ' + (pendingMatricula?.estudianteNombre ?? '') + '?'"
        confirmLabel="Eliminar"
        (confirm)="executeDelete()"
        (cancel)="showConfirm = false" />
    </div>
  `,
  styles: [`
    .page { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; min-height: 100%; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 1.625rem; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 0.875rem; color: #9ca3af; margin: 0.25rem 0 0; }

    .btn-primary {
      display: flex; align-items: center; gap: 0.5rem;
      background: #6366f1; color: white; border: none; border-radius: 10px;
      padding: 0.625rem 1.125rem; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s, transform 0.1s;
    }
    .btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }

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

    .monto-cell { font-size: 0.875rem; font-weight: 600; color: #111827; }
    .fecha-cell { font-size: 0.8125rem; color: #6b7280; }

    .row-actions { display: flex; gap: 0.25rem; }
    .action-btn {
      width: 30px; height: 30px; border-radius: 8px; border: 1px solid #f3f4f6;
      background: transparent; color: #9ca3af; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 0.75rem; transition: all 0.15s;
    }
    .action-btn:hover { background: #f5f3ff; color: #6366f1; border-color: #e0e7ff; }
    .action-btn.danger:hover { background: #fff1f2; color: #f43f5e; border-color: #fecdd3; }
    .action-btn.pay { color: #059669; }
    .action-btn.pay:hover { background: #d1fae5; color: #059669; border-color: #a7f3d0; }

    /* Detalle modal */
    .detalle-body { padding: 1.25rem 1.75rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
    .detalle-row { display: flex; justify-content: space-between; align-items: center; }
    .detalle-lbl { font-size: 0.875rem; color: #6b7280; }
    .detalle-monto { font-size: 1rem; font-weight: 700; color: #111827; }
    .detalle-val { font-size: 0.875rem; color: #374151; }
    .detalle-divider { height: 1px; background: #f3f4f6; }
    .detalle-hint {
      display: flex; align-items: center; gap: 0.375rem;
      font-size: 0.8125rem; color: #9ca3af;
      background: #fafafa; border-radius: 8px; padding: 0.625rem 0.875rem;
      margin-top: 0.25rem;
    }

    .skeleton-table { background: white; border: 1px solid #f3f4f6; border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; }
    .skeleton-row { display: flex; align-items: center; gap: 1.5rem; padding: 0.5rem 0; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; color: #e5e7eb; }
    .empty-state p { font-size: 0.9375rem; color: #9ca3af; margin: 0; }
    .btn-ghost { background: transparent; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.8125rem; font-weight: 500; color: #6b7280; cursor: pointer; }
    .btn-ghost:hover { border-color: #6366f1; color: #6366f1; }

    .text-center { text-align: center; }
    .p-8 { padding: 2rem; }

    :host-context(.dark-mode) .page-title { color: #f9fafb; }
    :host-context(.dark-mode) .table-card { background: #1e293b; border-color: #334155; }
    :host-context(.dark-mode) .monto-cell { color: #f1f5f9; }
    :host-context(.dark-mode) .grado-badge { background: #312e81; color: #a5b4fc; }
    :host-context(.dark-mode) .detalle-monto { color: #f1f5f9; }
    :host-context(.dark-mode) .detalle-divider { background: #334155; }
    :host-context(.dark-mode) .detalle-hint { background: #1e293b; }
  `]
})
export class MatriculasComponent implements OnInit {
  private matriculaService = inject(MatriculaService);
  private messageService = inject(MessageService);

  loading = signal(true);
  matriculas = signal<MatriculaDTO[]>([]);
  showForm = false;
  showConfirm = false;
  showConfirmPago = false;
  showDetalle = false;
  pendingMatricula: MatriculaDTO | null = null;
  pendingPago: MatriculaDTO | null = null;
  detalle: MatriculaDTO | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.matriculaService.getAll().subscribe({
      next: (data) => { this.matriculas.set(data); this.loading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las matrículas' });
        this.loading.set(false);
      }
    });
  }

  onSaved(result: MatriculaDTO[]) {
    this.showForm = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Matrícula registrada',
      detail: `${result.length} alumno${result.length !== 1 ? 's' : ''} matriculado${result.length !== 1 ? 's' : ''} correctamente`
    });
    this.load();
  }

  verDetalle(m: MatriculaDTO) {
    this.detalle = m;
    this.showDetalle = true;
  }

  onPagarMatricula(m: MatriculaDTO) {
    this.pendingPago = m;
    this.showConfirmPago = true;
  }

  executePago() {
    if (!this.pendingPago) return;
    this.matriculaService.pagar(this.pendingPago.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Matrícula pagada',
          detail: `Se generaron las mensualidades de ${this.pendingPago?.estudianteNombre}`
        });
        this.pendingPago = null;
        this.load();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el pago' })
    });
  }

  onDelete(m: MatriculaDTO) {
    this.pendingMatricula = m;
    this.showConfirm = true;
  }

  executeDelete() {
    if (!this.pendingMatricula) return;
    this.matriculaService.delete(this.pendingMatricula.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Matrícula eliminada' });
        this.pendingMatricula = null;
        this.load();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
    });
  }

  nivelLabel(nivel: string): string {
    return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel;
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  estadoSeverity(estado: string): any {
    return ({ ACTIVA: 'success', INACTIVA: 'warn', FINALIZADA: 'secondary' } as any)[estado] ?? 'info';
  }
}
