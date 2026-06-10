import { Component, OnInit, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { EstudianteService, EstudianteDTO } from '../../../core/services/estudiante.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-director-estudiantes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    TagModule, AvatarModule, SkeletonModule, ToastModule, InputTextModule
  ],
  providers: [MessageService],
  templateUrl: './estudiantes.component.html',
  styleUrl: './estudiantes.component.scss'
})
export class DirectorEstudiantesComponent implements OnInit {
  private estudianteService = inject(EstudianteService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loading = signal(true);
  estudiantes: EstudianteDTO[] = [];
  searchTerm = '';

  get filteredEstudiantes(): EstudianteDTO[] {
    if (!this.searchTerm) return this.estudiantes;
    const t = this.searchTerm.toLowerCase();
    return this.estudiantes.filter(e =>
      `${e.usuario?.nombre ?? ''} ${e.usuario?.apellido ?? ''}`.toLowerCase().includes(t) ||
      (e.dni ?? '').toLowerCase().includes(t)
    );
  }

  ngOnInit() {
    this.estudianteService.getAll().subscribe({
      next: data => { this.estudiantes = data; this.loading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los estudiantes' });
        this.loading.set(false);
      }
    });
  }

  verHistorial(id: number) {
    this.router.navigate(['/director/estudiantes', id]);
  }

  initials(e: EstudianteDTO): string {
    return `${e.usuario?.nombre?.[0] ?? ''}${e.usuario?.apellido?.[0] ?? ''}`.toUpperCase() || '?';
  }

  nivelSeverity(nivel: string): 'warn' | 'info' | 'success' | 'secondary' {
    return ({ INICIAL: 'warn', PRIMARIA: 'info', SECUNDARIA: 'success' } as any)[nivel] ?? 'secondary';
  }

  nivelLabel(nivel: string): string {
    return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel;
  }
}
