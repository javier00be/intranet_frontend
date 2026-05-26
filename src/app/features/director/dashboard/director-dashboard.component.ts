import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardService, DashboardData } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, AvatarModule, TagModule, SkeletonModule],
  template: `
    <div class="dashboard">

      <div class="dashboard-header">
        <div class="welcome-section">
          <h1>Panel de Dirección</h1>
          <p class="subtitle">Bienvenido, {{ nombreDirector() }} — aquí está el resumen de hoy</p>
        </div>
        <div class="header-actions">
          <p-button label="Nueva Matrícula" icon="pi pi-plus" routerLink="/director/profesores" />
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        @if (loading()) {
          @for (i of [1,2,3,4]; track i) {
            <p-card styleClass="stat-card">
              <p-skeleton height="4rem" />
            </p-card>
          }
        } @else {
          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon-wrapper stat-icon-blue">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label">Total Estudiantes</span>
                <span class="stat-value">{{ data()?.totalEstudiantes ?? 0 }}</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon-wrapper stat-icon-green">
                <i class="pi pi-id-card"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label">Total Profesores</span>
                <span class="stat-value">{{ data()?.totalProfesores ?? 0 }}</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon-wrapper stat-icon-orange">
                <i class="pi pi-book"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label">Cursos Activos</span>
                <span class="stat-value">{{ data()?.totalCursos ?? 0 }}</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card">
            <div class="stat-content">
              <div class="stat-icon-wrapper stat-icon-red">
                <i class="pi pi-wallet"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label">Pagos Pendientes</span>
                <span class="stat-value">{{ data()?.pagosPendientes ?? 0 }}</span>
                @if ((data()?.pagosPendientes ?? 0) > 0) {
                  <span class="stat-badge">Requiere atención</span>
                }
              </div>
            </div>
          </p-card>
        }
      </div>

      <!-- Quick Actions -->
      <p-card header="Acciones Rápidas" styleClass="actions-card">
        <div class="actions-grid">
          <a routerLink="/director/pagos" class="quick-action">
            <div class="action-icon action-icon-blue">
              <i class="pi pi-wallet"></i>
            </div>
            <span class="action-label">Gestionar Pagos</span>
            <span class="action-desc">Ver y gestionar cobros</span>
          </a>

          <a routerLink="/director/cursos" class="quick-action">
            <div class="action-icon action-icon-green">
              <i class="pi pi-book"></i>
            </div>
            <span class="action-label">Administrar Cursos</span>
            <span class="action-desc">Crear y editar cursos</span>
          </a>

          <a routerLink="/director/profesores" class="quick-action">
            <div class="action-icon action-icon-purple">
              <i class="pi pi-users"></i>
            </div>
            <span class="action-label">Gestionar Profesores</span>
            <span class="action-desc">Administrar staff</span>
          </a>

          <a routerLink="/director/reportes" class="quick-action">
            <div class="action-icon action-icon-orange">
              <i class="pi pi-chart-bar"></i>
            </div>
            <span class="action-label">Ver Reportes</span>
            <span class="action-desc">Estadísticas generales</span>
          </a>
        </div>
      </p-card>

      <!-- Actividad reciente -->
      <div class="recent-grid">
        <p-card header="Últimas Matrículas" styleClass="recent-card">
          <div class="recent-list">
            @for (item of ultimasMatriculas; track item.nombre) {
              <div class="recent-item">
                <p-avatar [label]="item.iniciales" shape="circle" size="large"
                  [style]="{'background-color': item.color, 'color': 'white'}" />
                <div class="recent-info">
                  <span class="recent-name">{{ item.nombre }}</span>
                  <span class="recent-detail">{{ item.curso }} · {{ item.fecha }}</span>
                </div>
                <p-tag [value]="item.estado"
                  [severity]="item.estado === 'Confirmado' ? 'success' : 'warn'" />
              </div>
            }
          </div>
        </p-card>

        <p-card header="Actividad Reciente" styleClass="recent-card">
          <div class="activity-list">
            @for (act of actividades; track act.descripcion) {
              <div class="activity-item">
                <div class="activity-icon" [ngClass]="act.tipo">
                  <i [class]="act.icono"></i>
                </div>
                <div class="activity-info">
                  <span class="activity-text">{{ act.descripcion }}</span>
                  <span class="activity-time">{{ act.tiempo }}</span>
                </div>
              </div>
            }
          </div>
        </p-card>
      </div>

    </div>
  `,
  styles: [`
    .dashboard {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .welcome-section h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      color: var(--ink-1, #111827);
    }

    .subtitle {
      color: var(--ink-4, #6b7280);
      margin: 0.5rem 0 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }

    .stat-content {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .stat-icon-wrapper {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon-wrapper i { font-size: 1.5rem; }

    .stat-icon-blue  { background: #e0e7ff; }
    .stat-icon-blue i  { color: #6366f1; }
    .stat-icon-green { background: #d1fae5; }
    .stat-icon-green i { color: #10b981; }
    .stat-icon-orange { background: #fef3c7; }
    .stat-icon-orange i { color: #f59e0b; }
    .stat-icon-red   { background: #ffe4e6; }
    .stat-icon-red i   { color: #f43f5e; }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--ink-4, #6b7280);
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--ink-1, #111827);
      line-height: 1.2;
    }

    .stat-badge {
      font-size: 0.75rem;
      color: #f43f5e;
      font-weight: 600;
      margin-top: 0.25rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .quick-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      border-radius: 12px;
      background: var(--surface-ground, #f9fafb);
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }

    .quick-action:hover {
      background: #e0e7ff;
      transform: translateY(-2px);
    }

    .action-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
    }

    .action-icon i { font-size: 1.25rem; }

    .action-icon-blue   { background: #e0e7ff; }
    .action-icon-blue i   { color: #6366f1; }
    .action-icon-green  { background: #d1fae5; }
    .action-icon-green i  { color: #10b981; }
    .action-icon-purple { background: #ede9fe; }
    .action-icon-purple i { color: #7c3aed; }
    .action-icon-orange { background: #fef3c7; }
    .action-icon-orange i { color: #f59e0b; }

    .action-label {
      font-weight: 600;
      color: var(--ink-1, #111827);
      margin-bottom: 0.25rem;
    }

    .action-desc {
      font-size: 0.75rem;
      color: var(--ink-4, #6b7280);
      text-align: center;
    }

    .recent-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .recent-list, .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .recent-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 8px;
      background: var(--surface-ground, #f9fafb);
    }

    .recent-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .recent-name {
      font-weight: 500;
      color: var(--ink-1, #111827);
    }

    .recent-detail {
      font-size: 0.875rem;
      color: var(--ink-4, #6b7280);
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .activity-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .activity-icon i { font-size: 0.875rem; }
    .activity-icon.pago   { background: #d1fae5; }
    .activity-icon.pago i   { color: #10b981; }
    .activity-icon.curso  { background: #e0e7ff; }
    .activity-icon.curso i  { color: #6366f1; }
    .activity-icon.usuario { background: #fef3c7; }
    .activity-icon.usuario i { color: #f59e0b; }

    .activity-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .activity-text {
      font-size: 0.875rem;
      color: var(--ink-1, #111827);
    }

    .activity-time {
      font-size: 0.75rem;
      color: var(--ink-5, #9ca3af);
    }
  `]
})
export class DirectorDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  loading = signal(true);
  data = signal<DashboardData | null>(null);

  nombreDirector = () => {
    const user = this.authService.user();
    return user ? user.nombre : '';
  };

  ngOnInit() {
    const user = this.authService.user();
    if (user) {
      this.dashboardService.get('DIRECTOR', user.id).subscribe({
        next: (res) => {
          this.data.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  ultimasMatriculas = [
    { nombre: 'Ana García',   iniciales: 'AG', color: '#6366f1', curso: '3° Secundaria A', fecha: 'Hoy',         estado: 'Confirmado' },
    { nombre: 'Carlos López', iniciales: 'CL', color: '#10b981', curso: '5° Primaria B',   fecha: 'Ayer',        estado: 'Pendiente'  },
    { nombre: 'María Pérez',  iniciales: 'MP', color: '#f59e0b', curso: '2° Secundaria A', fecha: 'Hace 2 días', estado: 'Confirmado' },
    { nombre: 'Juan Torres',  iniciales: 'JT', color: '#f43f5e', curso: '1° Primaria A',   fecha: 'Hace 3 días', estado: 'Pendiente'  },
  ];

  actividades = [
    { icono: 'pi pi-wallet',     tipo: 'pago',    descripcion: 'Pago registrado por María Pérez',   tiempo: 'Hace 5 min'   },
    { icono: 'pi pi-book',       tipo: 'curso',   descripcion: 'Nuevo curso: Educación Física',      tiempo: 'Hace 1 hora'  },
    { icono: 'pi pi-user-plus',  tipo: 'usuario', descripcion: 'Nuevo profesor registrado',          tiempo: 'Hace 2 horas' },
    { icono: 'pi pi-check-circle', tipo: 'pago',  descripcion: 'Matrícula confirmada de Ana García', tiempo: 'Hace 3 horas' },
  ];
}
