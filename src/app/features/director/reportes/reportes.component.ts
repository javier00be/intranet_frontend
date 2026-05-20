import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule
  ],
  template: `
    <div class="page-container">
      <div class="header">
        <div class="title-section">
          <h1>Centro de Reportes</h1>
          <p class="subtitle">Análisis detallado de rendimiento y finanzas</p>
        </div>
        <div class="actions">
          <p-button label="Generar PDF" icon="pi pi-file-pdf" severity="danger" />
          <p-button label="Descargar Excel" icon="pi pi-file-excel" severity="success" />
        </div>
      </div>

      <div class="charts-grid">
        <p-card header="Rendimiento Académico por Grado">
          <p-chart type="bar" [data]="performanceData" [options]="chartOptions" />
        </p-card>
        
        <p-card header="Distribución de Pagos">
          <p-chart type="doughnut" [data]="paymentDistData" [options]="chartOptions" />
        </p-card>
      </div>

      <div class="secondary-grid">
        <p-card header="Asistencia Mensual" styleClass="flex-1">
          <p-chart type="line" [data]="attendanceData" [options]="chartOptions" />
        </p-card>

        <p-card header="Alertas de Rendimiento Bajo" styleClass="flex-1">
          <p-table [value]="alertas" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Estudiante</th>
                <th>Grado</th>
                <th>Promedio</th>
                <th>Estado</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-alerta>
              <tr>
                <td>{{ alerta.nombre }}</td>
                <td>{{ alerta.grado }}</td>
                <td><span class="font-bold text-red-500">{{ alerta.promedio }}</span></td>
                <td><p-tag value="Riesgo" severity="danger" /></td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>
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

    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    .secondary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .flex-1 { flex: 1; }

    /* Dark mode */
    :host-context(.dark-mode) .title-section h1 {
      color: #f9fafb;
    }
  `]
})
export class ReportesComponent {
  performanceData: any;
  paymentDistData: any;
  attendanceData: any;
  chartOptions: any;

  alertas = [
    { nombre: 'Juan Torres', grado: '1° Primaria A', promedio: '10.5' },
    { nombre: 'Lucía Méndez', grado: '3° Secundaria B', promedio: '11.2' },
    { nombre: 'Pedro Soto', grado: '5° Secundaria A', promedio: '09.8' }
  ];

  constructor() {
    this.performanceData = {
      labels: ['1° Pri', '2° Pri', '3° Pri', '4° Pri', '5° Pri', '1° Sec', '2° Sec'],
      datasets: [
        {
          label: 'Promedio General',
          backgroundColor: '#6366f1',
          data: [15, 17, 14, 16, 18, 14, 15]
        }
      ]
    };

    this.paymentDistData = {
      labels: ['Pagado', 'Pendiente', 'Mora'],
      datasets: [
        {
          data: [300, 50, 20],
          backgroundColor: ['#10b981', '#f59e0b', '#f43f5e']
        }
      ]
    };

    this.attendanceData = {
      labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      datasets: [
        {
          label: 'Asistencia %',
          data: [95, 92, 98, 94],
          fill: false,
          borderColor: '#6366f1',
          tension: 0.4
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#4b5563'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#e5e7eb'
          },
          ticks: {
            color: '#9ca3af'
          }
        },
        x: {
          grid: {
            color: '#e5e7eb'
          },
          ticks: {
            color: '#9ca3af'
          }
        }
      }
    };
  }
}