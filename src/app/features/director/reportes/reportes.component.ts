import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ReportesService, AlertaEstudiante } from '../../../core/services/reportes.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ChartModule, TableModule, TagModule, SkeletonModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  private reportesService = inject(ReportesService);
  private cdr             = inject(ChangeDetectorRef);

  loading          = signal(true);
  performanceData  = signal<any>(null);
  paymentDistData  = signal<any>(null);
  attendanceData   = signal<any>(null);
  alertas          = signal<AlertaEstudiante[]>([]);

  chartOptions = {
    plugins: { legend: { labels: { color: '#4b5563' } } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#9ca3af' } },
      x: { grid: { color: '#e5e7eb' }, ticks: { color: '#9ca3af' } }
    }
  };

  doughnutOptions = {
    plugins: { legend: { labels: { color: '#4b5563' } } }
  };

  ngOnInit() {
    this.reportesService.getReportes().subscribe({
      next: (data) => {
        this.performanceData.set({
          labels: data.rendimientoGrado.map(g => g.label),
          datasets: [{
            label: 'Promedio General',
            backgroundColor: '#6366f1',
            data: data.rendimientoGrado.map(g => g.promedio)
          }]
        });

        this.paymentDistData.set({
          labels: ['Pagado', 'Pendiente', 'Vencido'],
          datasets: [{
            data: [data.pagosPagados, data.pagosPendientes, data.pagosVencidos],
            backgroundColor: ['#10b981', '#f59e0b', '#f43f5e']
          }]
        });

        this.attendanceData.set({
          labels: data.asistenciaMensual.map(a => a.mes),
          datasets: [{
            label: 'Asistencia %',
            data: data.asistenciaMensual.map(a => a.porcentaje),
            fill: false,
            borderColor: '#6366f1',
            tension: 0.4
          }]
        });

        this.alertas.set(data.alertas);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }
}
