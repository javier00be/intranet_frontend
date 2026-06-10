import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';

interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string;
  items?: MenuItem[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, AvatarModule, MenuModule, RippleModule, TooltipModule],
  template: `
    <div class="layout" [class.dark-mode]="themeService.darkMode()">

      <!-- Mobile overlay -->
      <div class="sidebar-overlay" [class.active]="mobileMenuOpen()" (click)="closeMobileMenu()"></div>

      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()" [class.mobile-open]="mobileMenuOpen()">
        <div class="sidebar-header">
          @if (!sidebarCollapsed()) {
            <div class="logo">
              <div class="logo-mark">AE</div>
              <div class="logo-text">
                Albert Einstein
                <small>Intranet · 2026</small>
              </div>
            </div>
          }
          <button class="toggle-btn" (click)="toggleSidebar()" [title]="sidebarCollapsed() ? 'Expandir' : 'Colapsar'">
            <i class="pi" [class.pi-angle-left]="!sidebarCollapsed()" [class.pi-angle-right]="sidebarCollapsed()"></i>
          </button>
        </div>

        <nav class="sidebar-menu">
          @for (item of menuItems(); track item.label) {
            @if (!item.items) {
              <a
                [routerLink]="item.routerLink"
                routerLinkActive="active"
                class="menu-item"
                [pTooltip]="sidebarCollapsed() ? item.label : ''"
                tooltipPosition="right">
                <i class="pi" [class]="item.icon"></i>
                @if (!sidebarCollapsed()) {
                  <span>{{ item.label }}</span>
                }
              </a>
            } @else {
              <div class="menu-group">
                @if (!sidebarCollapsed()) {
                  <div class="menu-section-title">{{ item.label }}</div>
                }
                @for (sub of item.items; track sub.label) {
                  <a
                    [routerLink]="sub.routerLink"
                    routerLinkActive="active"
                    class="menu-item"
                    [pTooltip]="sidebarCollapsed() ? sub.label : ''"
                    tooltipPosition="right">
                    <i class="pi" [class]="sub.icon"></i>
                    @if (!sidebarCollapsed()) {
                      <span>{{ sub.label }}</span>
                    }
                  </a>
                }
              </div>
            }
          }
        </nav>

        <div class="sidebar-footer">
          @if (authService.user(); as user) {
            <div class="user-info" [class.collapsed]="sidebarCollapsed()" (click)="logout()" title="Cerrar sesión">
              <p-avatar
                [label]="userInitials()"
                shape="circle"
                [style]="{ background: 'var(--accent)', color: 'white', fontWeight: '500' }" />
              @if (!sidebarCollapsed()) {
                <div class="user-details">
                  <span class="user-name">{{ user.nombre }} {{ user.apellido }}</span>
                  <span class="user-role">{{ user.rol | titlecase }}</span>
                </div>
                <i class="pi pi-chevron-right" style="color: var(--ink-4); font-size: 12px;"></i>
              }
            </div>
          }
        </div>
      </aside>

      <!-- Main -->
      <main class="main-content">
        <header class="topbar">
          <button class="icon-btn hamburger-btn" (click)="toggleMobileMenu()" title="Menú">
            <i class="pi pi-bars"></i>
          </button>

          <div class="topbar-title">
            <div class="page-title">{{ currentPageTitle() }}</div>
          </div>

          <div class="topbar-search">
            <i class="pi pi-search"></i>
            <input type="text" placeholder="Buscar en la intranet…" />
            <span class="topbar-kbd">Ctrl K</span>
          </div>

          <div class="topbar-actions">
            <button class="icon-btn" (click)="themeService.toggle()" [title]="themeService.darkMode() ? 'Modo claro' : 'Modo oscuro'">
              <i class="pi" [class.pi-sun]="themeService.darkMode()" [class.pi-moon]="!themeService.darkMode()"></i>
            </button>
            <button class="icon-btn" title="Notificaciones">
              <i class="pi pi-bell"></i>
            </button>
          </div>
        </header>

        <div class="content">
          <router-outlet />
        </div>
      </main>

    </div>
  `,
  styles: [``]
})
export class LayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  private currentUrl = signal(this.router.url);

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.currentUrl.set((e as NavigationEnd).urlAfterRedirects);
      this.mobileMenuOpen.set(false);
    });
  }

  menuItems = computed<MenuItem[]>(() => {
    const user = this.authService.user();
    const rol = user?.rol;
    
    if (rol === 'director') {
      return [
        { label: 'Dashboard',   icon: 'pi-home',           routerLink: '/director/dashboard'   },
        { label: 'Matrículas', icon: 'pi-graduation-cap', routerLink: '/director/matriculas'  },
        { label: 'Pagos',      icon: 'pi-wallet',         routerLink: '/director/pagos'       },
        { label: 'Cursos',     icon: 'pi-book',           routerLink: '/director/cursos'      },
        { label: 'Profesores', icon: 'pi-users',          routerLink: '/director/profesores'  },
        { label: 'Padres',     icon: 'pi-heart',          routerLink: '/director/padres'      },
        { label: 'Estudiantes', icon: 'pi-graduation-cap', routerLink: '/director/estudiantes' },
        { label: 'Reportes',   icon: 'pi-chart-bar',      routerLink: '/director/reportes'    }
      ];
    }
    
    if (rol === 'profesor') {
      return [
        { label: 'Dashboard',  icon: 'pi-home',      routerLink: '/profesor/dashboard'  },
        { label: 'Mis Cursos', icon: 'pi-book',       routerLink: '/profesor/cursos'     },
        { label: 'Alumnos',    icon: 'pi-users',      routerLink: '/profesor/alumnos'    },
        { label: 'Notas',      icon: 'pi-chart-bar',  routerLink: '/profesor/notas'      },
        { label: 'Tareas',     icon: 'pi-file',       routerLink: '/profesor/tareas'     },
        { label: 'Calendario', icon: 'pi-calendar',   routerLink: '/profesor/calendario' }
      ];
    }
    
    if (rol === 'padre') {
      return [
        { label: 'Dashboard',   icon: 'pi-home',      routerLink: '/padre/dashboard'    },
        { label: 'Mis Hijos',   icon: 'pi-users',     routerLink: '/padre/hijos'        },
        { label: 'Calificaciones', icon: 'pi-star',   routerLink: '/padre/calificaciones' },
        { label: 'Asistencia',  icon: 'pi-calendar',  routerLink: '/padre/asistencia'   },
        { label: 'Pagos',       icon: 'pi-wallet',    routerLink: '/padre/pagos'        },
        { label: 'Chat',        icon: 'pi-comments',  routerLink: '/padre/chat'         }
      ];
    }

    if (rol === 'estudiante') {
      return [
        { label: 'Dashboard', icon: 'pi-home', routerLink: '/dashboard' },
        { label: 'Mis Cursos', icon: 'pi-book', routerLink: '/estudiante/cursos' },
        { label: 'Tareas', icon: 'pi-file', routerLink: '/estudiante/tareas' },
        { label: 'Calendario', icon: 'pi-calendar', routerLink: '/estudiante/calendario' },
        { label: 'Mis Notas', icon: 'pi-chart-bar', routerLink: '/estudiante/notas' }
      ];
    }

    return [];
  });

  currentPageTitle = computed(() => {
    const url = this.currentUrl();
    const user = this.authService.user();
    
    if (url.includes('dashboard')) {
      const rol = user?.rol || '';
      const labels: Record<string, string> = {
        director: 'Panel de Dirección',
        profesor: 'Panel del Profesor',
        padre: 'Panel del Padre',
        estudiante: 'Panel del Estudiante'
      };
      return labels[rol] ?? 'Dashboard';
    }
    if (url.includes('matriculas')) return 'Matrículas';
    if (url.includes('pagos')) return 'Gestión de Pagos';
    if (url.includes('/director/cursos')) return 'Administración de Cursos';
    if (url.includes('profesores')) return 'Gestión de Profesores';
    if (url.includes('/director/padres')) return 'Gestión de Padres';
    if (url.includes('reportes')) return 'Reportes';
    if (url.includes('/director/estudiantes/')) return 'Historial del Alumno';
    if (url.includes('/director/estudiantes')) return 'Estudiantes';
    if (url.includes('/profesor/cursos')) return 'Mis Cursos';
    if (url.includes('/profesor/tareas')) return 'Gestión de Tareas';
    if (url.includes('/profesor/alumnos')) return 'Mis Alumnos';
    if (url.includes('/profesor/calendario')) return 'Calendario';
    if (url.includes('/profesor/notas')) return 'Registro de Notas';
    if (url.includes('/padre/hijos')) return 'Mis Hijos';
    if (url.includes('/padre/calificaciones')) return 'Notas de mis Hijos';
    if (url.includes('/padre/asistencia')) return 'Asistencia de mis Hijos';
    if (url.includes('/padre/pagos')) return 'Estado de Pagos';
    if (url.includes('/padre/chat')) return 'Chat con Profesores';
    if (url.includes('/estudiante/cursos')) return 'Mis Cursos';
    if (url.includes('/estudiante/tareas')) return 'Mis Tareas';
    if (url.includes('/estudiante/calendario')) return 'Calendario';
    if (url.includes('/estudiante/notas')) return 'Mis Notas';
    return 'Intranet Escolar';
  });

  userInitials = computed(() => {
    const user = this.authService.user();
    if (!user) return '?';
    return `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase();
  });

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}