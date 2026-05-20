import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PagoService, Pago } from '../../../core/services/pago.service';
import { PagoFormComponent } from '../../../shared/components/pago-form/pago-form.component';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    ProgressSpinnerModule,
    ToastModule,
    PagoFormComponent
  ],
  providers: [MessageService],
  template: `
    <div class="page-container">
      <p-toast />
      <div class="header">
        <div class="title-section">
          <h1>Gestión de Pagos</h1>
          <p class="subtitle">Administra matrículas, pensiones y estados financieros</p>
        </div>
        <div class="actions">
          <p-button label="Exportar Reporte" icon="pi pi-file-export" severity="secondary" />
          <p-button label="Nuevo Registro" icon="pi pi-plus" (click)="showDialog()" />
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-mini-card">
          <span class="label">Recaudado (Mes)</span>
          <span class="value">{{ totalRecaudado | currency }}</span>
          <span class="trend positive">+5.4%</span>
        </div>
        <div class="stat-mini-card">
          <span class="label">Pendiente</span>
          <span class="value">{{ totalPendiente | currency }}</span>
          <span class="trend negative">{{ pagosPendientesCount }} recibos</span>
        </div>
        <div class="stat-mini-card">
          <span class="label">Becados</span>
          <span class="value">8</span>
          <span class="trend neutral">Estudiantes</span>
        </div>
      </div>

      <p-card>
        <div *ngIf="isLoading()" class="flex justify-center p-8">
          <p-progressspinner styleClass="w-16 h-16" strokeWidth="4" fill="transparent" animationDuration=".5s" />
        </div>

        <p-table 
          *ngIf="!isLoading()"
          [value]="pagos" 
          [paginator]="true" 
          [rows]="10" 
          [tableStyle]="{'min-width': '60rem'}"
          styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>ID</th>
              <th>Estudiante</th>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-pago>
            <tr>
              <td>#{{ pago.id }}</td>
              <td>
                <div class="student-info">
                  <span class="name">{{ pago.estudianteNombre || 'N/A' }}</span>
                  <span class="grade">{{ pago.grado || 'Grado no esp.' }}</span>
                </div>
              </td>
              <td>{{ pago.concepto }}</td>
              <td>{{ pago.monto | currency }}</td>
              <td>{{ pago.fecha | date:'dd/MM/yyyy' }}</td>
              <td>{{ pago.metodo }}</td>
              <td>
                <p-tag [value]="pago.estado" [severity]="getSeverity(pago.estado)" />
              </td>
              <td>
                <div class="table-actions">
                  <p-button icon="pi pi-eye" severity="secondary" rounded text />
                  <p-button icon="pi pi-print" severity="secondary" rounded text />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center p-8">No se encontraron registros de pagos.</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <p-dialog header="Registrar Nuevo Pago" [(visible)]="display" [modal]="true" [style]="{ width: '450px' }">
        <app-pago-form (save)="onSavePago($event)" (cancel)="display = false" />
      </p-dialog>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-section h1 {
      font-size: 1.75rem;
      margin: 0;
      color: #111827;
    }

    .subtitle {
      color: #6b7280;
      margin: 0.25rem 0 0;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .stat-mini-card {
      background: white;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .stat-mini-card .label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .stat-mini-card .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0.25rem 0;
    }

    .stat-mini-card .trend {
      font-size: 0.75rem;
      font-weight: 600;
    }

    .trend.positive { color: #10b981; }
    .trend.negative { color: #f43f5e; }
    .trend.neutral { color: #6b7280; }

    .student-info {
      display: flex;
      flex-direction: column;
    }

    .student-info .grade {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .table-actions {
      display: flex;
      gap: 0.25rem;
    }

    .flex { display: flex; }
    .justify-center { justify-content: center; }
    .p-8 { padding: 2rem; }
    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }

    /* Dark mode */
    :host-context(.dark-mode) .stat-mini-card {
      background: #1e293b;
      border-color: #334155;
    }

    :host-context(.dark-mode) .stat-mini-card .value,
    :host-context(.dark-mode) .title-section h1 {
      color: #f9fafb;
    }
  `]
})
export class PagosComponent implements OnInit {
  private pagoService = inject(PagoService);
  private messageService = inject(MessageService);
  
  display: boolean = false;
  isLoading = signal<boolean>(true);
  pagos: Pago[] = [];
  
  totalRecaudado = 0;
  totalPendiente = 0;
  pagosPendientesCount = 0;

  ngOnInit() {
    this.loadPagos();
  }

  loadPagos() {
    this.isLoading.set(true);
    this.pagoService.getAll().subscribe({
      next: (data) => {
        this.pagos = data;
        this.calculateStats();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pagos' });
        this.isLoading.set(false);
      }
    });
  }

  calculateStats() {
    this.totalRecaudado = this.pagos
      .filter(p => p.estado === 'Completado' || p.estado === 'PAGADO')
      .reduce((acc, curr) => acc + curr.monto, 0);
    
    const pendientes = this.pagos.filter(p => p.estado === 'Pendiente' || p.estado === 'PENDIENTE');
    this.totalPendiente = pendientes.reduce((acc, curr) => acc + curr.monto, 0);
    this.pagosPendientesCount = pendientes.length;
  }

  showDialog() {
    this.display = true;
  }

  onSavePago(pago: Pago) {
    this.pagoService.create(pago).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pago registrado correctamente' });
        this.display = false;
        this.loadPagos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el pago' });
      }
    });
  }

  getSeverity(estado: string): any {
    const e = estado.toUpperCase();
    if (e === 'COMPLETADO' || e === 'PAGADO') return 'success';
    if (e === 'PENDIENTE') return 'warn';
    if (e === 'FALLIDO' || e === 'VENCIDO') return 'danger';
    return 'info';
  }
}