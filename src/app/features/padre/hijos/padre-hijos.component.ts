import { Component, OnInit, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, switchMap, of } from 'rxjs';
import { PadreService } from '../../../core/services/padre.service';
import { EstudianteService, EstudianteDTO } from '../../../core/services/estudiante.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-padre-hijos',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, TagModule, SkeletonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './padre-hijos.component.html',
  styleUrl: './padre-hijos.component.scss'
})
export class PadreHijosComponent implements OnInit {
  private padreService      = inject(PadreService);
  private estudianteService  = inject(EstudianteService);
  private router             = inject(Router);
  private messageService     = inject(MessageService);

  loading = signal(true);
  hijos   = signal<EstudianteDTO[]>([]);

  ngOnInit() {
    this.padreService.getMe().pipe(
      switchMap(padre => {
        const ids = padre.hijoIds ?? [];
        if (!ids.length) return of([]);
        return forkJoin(ids.map(id => this.estudianteService.getById(id)));
      })
    ).subscribe({
      next: hijos => { this.hijos.set(hijos); this.loading.set(false); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de hijos' }); this.loading.set(false); }
    });
  }

  initials(h: EstudianteDTO): string {
    return `${h.usuario?.nombre?.[0] ?? ''}${h.usuario?.apellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  nivelLabel(n: string): string {
    return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[n] ?? n;
  }

  verNotas(id: number)      { this.router.navigate(['/padre/calificaciones'], { queryParams: { hijo: id } }); }
  verAsistencia(id: number) { this.router.navigate(['/padre/asistencia'],     { queryParams: { hijo: id } }); }
  verPagos(id: number)      { this.router.navigate(['/padre/pagos'],           { queryParams: { hijo: id } }); }
}
