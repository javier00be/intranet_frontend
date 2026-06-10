import { Component, OnInit, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, switchMap } from 'rxjs';
import { PadreService } from '../../../core/services/padre.service';
import { EstudianteService, EstudianteDTO, AsistenciaDTO } from '../../../core/services/estudiante.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-padre-asistencia',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, AvatarModule, SkeletonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './padre-asistencia.component.html',
  styleUrl: './padre-asistencia.component.scss'
})
export class PadreAsistenciaComponent implements OnInit {
  private padreService     = inject(PadreService);
  private estudianteService = inject(EstudianteService);
  private route            = inject(ActivatedRoute);
  private messageService   = inject(MessageService);

  loading  = signal(true);
  hijos    = signal<EstudianteDTO[]>([]);
  selected = signal<EstudianteDTO | null>(null);
  asistencias = signal<AsistenciaDTO[]>([]);
  loadingData = signal(false);

  pct = signal<number | null>(null);

  ngOnInit() {
    const hijoIdParam = Number(this.route.snapshot.queryParamMap.get('hijo'));
    this.padreService.getMe().pipe(
      switchMap(padre => forkJoin((padre.hijoIds ?? []).map(id => this.estudianteService.getById(id))))
    ).subscribe({
      next: hijos => {
        this.hijos.set(hijos);
        const initial = hijoIdParam ? hijos.find(h => h.id === hijoIdParam) : hijos[0];
        if (initial) this.selectHijo(initial);
        this.loading.set(false);
      },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar' }); this.loading.set(false); }
    });
  }

  selectHijo(h: EstudianteDTO) {
    this.selected.set(h);
    this.loadingData.set(true);
    this.estudianteService.getAsistencias(h.id).subscribe({
      next: data => {
        this.asistencias.set(data);
        const pct = data.length ? Math.round((data.filter(a => a.presente).length / data.length) * 100) : null;
        this.pct.set(pct);
        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false)
    });
  }

  initials(h: EstudianteDTO): string {
    return `${h.usuario?.nombre?.[0] ?? ''}${h.usuario?.apellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  pctColor(p: number): string {
    if (p >= 85) return 'var(--green-500)';
    if (p >= 70) return 'var(--yellow-500)';
    return 'var(--red-500)';
  }
}
