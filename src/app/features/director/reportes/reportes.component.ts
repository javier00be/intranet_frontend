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
  imports: [CommonModule, CardModule, ButtonModule, ChartModule, TableModule, TagModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent {
  performanceData: any;
  paymentDistData: any;
  attendanceData: any;
  chartOptions: any;

  alertas = [
    { nombre: 'Juan Torres',   grado: '1° Primaria A',    promedio: '10.5' },
    { nombre: 'Lucía Méndez',  grado: '3° Secundaria B',  promedio: '11.2' },
    { nombre: 'Pedro Soto',    grado: '5° Secundaria A',  promedio: '09.8' }
  ];

  constructor() {
    this.performanceData = {
      labels: ['1° Pri', '2° Pri', '3° Pri', '4° Pri', '5° Pri', '1° Sec', '2° Sec'],
      datasets: [{ label: 'Promedio General', backgroundColor: '#6366f1', data: [15, 17, 14, 16, 18, 14, 15] }]
    };

    this.paymentDistData = {
      labels: ['Pagado', 'Pendiente', 'Mora'],
      datasets: [{ data: [300, 50, 20], backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'] }]
    };

    this.attendanceData = {
      labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      datasets: [{ label: 'Asistencia %', data: [95, 92, 98, 94], fill: false, borderColor: '#6366f1', tension: 0.4 }]
    };

    this.chartOptions = {
      plugins: { legend: { labels: { color: '#4b5563' } } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#9ca3af' } },
        x: { grid: { color: '#e5e7eb' }, ticks: { color: '#9ca3af' } }
      }
    };
  }
}
