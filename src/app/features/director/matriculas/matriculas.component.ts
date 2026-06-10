import { Component, OnInit, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { MatriculaService, MatriculaDTO } from '../../../core/services/matricula.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { MatriculaFormComponent } from '../../../shared/components/matricula-form/matricula-form.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-matriculas',
  standalone: true,
  imports: [
    CommonModule, TableModule, ButtonModule, TagModule,
    SkeletonModule, ToastModule, TooltipModule,
    ModalComponent, ConfirmModalComponent, MatriculaFormComponent,
  ],
  providers: [MessageService],
  templateUrl: './matriculas.component.html',
  styleUrl: './matriculas.component.scss'
})
export class MatriculasComponent implements OnInit {
  private matriculaService = inject(MatriculaService);
  private messageService = inject(MessageService);

  loading = signal(true);
  matriculas = signal<MatriculaDTO[]>([]);
  showForm = false;
  showConfirm = false;
  showConfirmPago = false;
  showDetalle = false;
  pendingMatricula: MatriculaDTO | null = null;
  pendingPago: MatriculaDTO | null = null;
  detalle: MatriculaDTO | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.matriculaService.getAll().subscribe({
      next: (data) => { this.matriculas.set(data); this.loading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las matrículas' });
        this.loading.set(false);
      }
    });
  }

  onSaved(result: MatriculaDTO[]) {
    this.showForm = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Matrícula registrada',
      detail: `${result.length} alumno${result.length !== 1 ? 's' : ''} matriculado${result.length !== 1 ? 's' : ''} correctamente`
    });
    this.load();
  }

  verDetalle(m: MatriculaDTO) {
    this.detalle = m;
    this.showDetalle = true;
  }

  onPagarMatricula(m: MatriculaDTO) {
    this.pendingPago = m;
    this.showConfirmPago = true;
  }

  executePago() {
    if (!this.pendingPago) return;
    this.matriculaService.pagar(this.pendingPago.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Matrícula pagada',
          detail: `Se generaron las mensualidades de ${this.pendingPago?.estudianteNombre}`
        });
        this.pendingPago = null;
        this.load();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el pago' })
    });
  }

  onDelete(m: MatriculaDTO) {
    this.pendingMatricula = m;
    this.showConfirm = true;
  }

  executeDelete() {
    if (!this.pendingMatricula) return;
    this.matriculaService.delete(this.pendingMatricula.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Matrícula eliminada' });
        this.pendingMatricula = null;
        this.load();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
    });
  }

  nivelLabel(nivel: string): string {
    return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel;
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  estadoSeverity(estado: string): any {
    return ({ ACTIVA: 'success', INACTIVA: 'warn', FINALIZADA: 'secondary' } as any)[estado] ?? 'info';
  }
}
