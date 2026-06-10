import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, AvatarModule, TagModule, SkeletonModule],
  templateUrl: './director-dashboard.component.html',
  styleUrl: './director-dashboard.component.scss'
})
export class DirectorDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  loading = signal(true);
  data = signal<DashboardData | null>(null);

  nombreDirector = computed(() => this.authService.user()?.nombre ?? '');

  ngOnInit() {
    this.dashboardService.get().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ultimasMatriculas = [
    { nombre: 'Ana García',   iniciales: 'AG', color: '#6366f1', curso: '3° Secundaria A', fecha: 'Hoy',         estado: 'Confirmado' },
    { nombre: 'Carlos López', iniciales: 'CL', color: '#10b981', curso: '5° Primaria B',   fecha: 'Ayer',        estado: 'Pendiente'  },
    { nombre: 'María Pérez',  iniciales: 'MP', color: '#f59e0b', curso: '2° Secundaria A', fecha: 'Hace 2 días', estado: 'Confirmado' },
    { nombre: 'Juan Torres',  iniciales: 'JT', color: '#f43f5e', curso: '1° Primaria A',   fecha: 'Hace 3 días', estado: 'Pendiente'  },
  ];

  actividades = [
    { icono: 'pi pi-wallet',       tipo: 'pago',    descripcion: 'Pago registrado por María Pérez',   tiempo: 'Hace 5 min'   },
    { icono: 'pi pi-book',         tipo: 'curso',   descripcion: 'Nuevo curso: Educación Física',      tiempo: 'Hace 1 hora'  },
    { icono: 'pi pi-user-plus',    tipo: 'usuario', descripcion: 'Nuevo profesor registrado',          tiempo: 'Hace 2 horas' },
    { icono: 'pi pi-check-circle', tipo: 'pago',    descripcion: 'Matrícula confirmada de Ana García', tiempo: 'Hace 3 horas' },
  ];
}
