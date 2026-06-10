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
import { EstudianteService, EstudianteDTO } from '../../../core/services/estudiante.service';
import { MensualidadService, MensualidadDTO } from '../../../core/services/mensualidad.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-padre-pagos',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, AvatarModule, SkeletonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './padre-pagos.component.html',
  styleUrl: './padre-pagos.component.scss'
})
export class PadrePagosComponent implements OnInit {
  private padreService      = inject(PadreService);
  private estudianteService  = inject(EstudianteService);
  private mensualidadService = inject(MensualidadService);
  private route              = inject(ActivatedRoute);
  private messageService     = inject(MessageService);

  loading  = signal(true);
  hijos    = signal<EstudianteDTO[]>([]);
  selected = signal<EstudianteDTO | null>(null);
  mensualidades = signal<MensualidadDTO[]>([]);
  loadingData   = signal(false);

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
    this.mensualidadService.getByEstudiante(h.id).subscribe({
      next: data => { this.mensualidades.set(data); this.loadingData.set(false); },
      error: () => this.loadingData.set(false)
    });
  }

  initials(h: EstudianteDTO): string {
    return `${h.usuario?.nombre?.[0] ?? ''}${h.usuario?.apellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  estadoSeverity(e: string): any {
    return ({ PAGADO: 'success', PENDIENTE: 'warn', VENCIDO: 'danger' } as any)[e] ?? 'secondary';
  }

  mesLabel(m: string): string {
    const map: Record<string, string> = {
      ENERO: 'Enero', FEBRERO: 'Febrero', MARZO: 'Marzo', ABRIL: 'Abril',
      MAYO: 'Mayo', JUNIO: 'Junio', JULIO: 'Julio', AGOSTO: 'Agosto',
      SEPTIEMBRE: 'Septiembre', OCTUBRE: 'Octubre', NOVIEMBRE: 'Noviembre', DICIEMBRE: 'Diciembre'
    };
    return map[m] ?? m;
  }

  get totalPendiente(): number {
    return this.mensualidades().filter(m => m.estadoPago !== 'PAGADO').reduce((acc, m) => acc + (m.monto ?? 0), 0);
  }
}
