import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { DatePicker } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CursoService, Curso } from '../../../core/services/curso.service';
import { TareaService, TareaDTO } from '../../../core/services/tarea.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tareas',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    Select, InputTextModule, Textarea, DatePicker, ButtonModule,
    TableModule, SkeletonModule, ToastModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmdialog />

    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Gestión de tareas</h1>
      </div>

      <div class="filter-bar">
        <p-select
          [options]="cursoOptions()"
          [(ngModel)]="selectedCursoId"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccioná un curso"
          [style]="{ minWidth: '320px' }"
          (onChange)="onCursoChange()" />
      </div>

      @if (selectedCursoId) {
        <div class="nueva-tarea-form">
          <h4>Nueva tarea</h4>
          <div class="form-row">
            <input
              pInputText
              [(ngModel)]="form.titulo"
              placeholder="Título de la tarea"
              style="flex: 1" />
            <p-datepicker
              [(ngModel)]="form.fechaEntrega"
              dateFormat="dd/mm/yy"
              placeholder="Fecha de entrega"
              [style]="{ width: '180px' }" />
            <p-button
              label="Agregar"
              icon="pi pi-plus"
              (onClick)="crearTarea()"
              [loading]="saving()"
              [disabled]="!form.titulo.trim()" />
          </div>
          <div class="form-row">
            <textarea
              pTextarea
              [(ngModel)]="form.descripcion"
              placeholder="Descripción (opcional)"
              rows="2"
              style="flex: 1; resize: vertical"></textarea>
          </div>
        </div>

        @if (loading()) {
          <div>
            @for (i of [1,2,3]; track i) {
              <p-skeleton height="52px" styleClass="mb-2" />
            }
          </div>
        } @else {
          <p-table
            [value]="tareas()"
            responsiveLayout="scroll"
            stripedRows
            [rows]="20"
            [paginator]="tareas().length > 20">
            <ng-template pTemplate="header">
              <tr>
                <th>Título</th>
                <th>Descripción</th>
                <th>Fecha de entrega</th>
                <th style="width: 80px"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-t>
              <tr>
                <td><strong>{{ t.titulo }}</strong></td>
                <td class="td-desc">{{ t.descripcion ?? '—' }}</td>
                <td>{{ t.fechaEntrega ? (t.fechaEntrega | date:'dd/MM/yyyy') : '—' }}</td>
                <td>
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    [text]="true"
                    (onClick)="confirmarEliminar(t)" />
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="4" class="empty-msg">No hay tareas para este curso todavía.</td>
              </tr>
            </ng-template>
          </p-table>
        }
      } @else {
        <div class="select-prompt">
          <i class="pi pi-book"></i>
          <p>Seleccioná un curso para ver y crear tareas</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; min-height: 100%; }

    .page-header { display: flex; flex-direction: column; gap: 0.25rem; }
    .page-title { font-size: 1.625rem; font-weight: 700; color: var(--ink); margin: 0; letter-spacing: -0.02em; }

    .filter-bar { display: flex; align-items: center; gap: 1rem; }

    .nueva-tarea-form {
      background: var(--card-bg);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .nueva-tarea-form h4 { margin: 0 0 1rem; font-size: 0.9375rem; font-weight: 600; color: var(--ink-2); }

    .form-row { display: flex; gap: 0.75rem; align-items: flex-start; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .form-row:last-child { margin-bottom: 0; }

    .td-desc { color: var(--ink-3); font-size: 0.875rem; max-width: 280px; }

    .empty-msg { text-align: center; color: var(--ink-4); padding: 2rem; font-size: 0.9375rem; }

    .select-prompt { text-align: center; padding: 4rem; color: var(--ink-4); }
    .select-prompt i { font-size: 2.5rem; display: block; margin-bottom: 1rem; color: var(--line); }
    .select-prompt p { margin: 0; font-size: 0.9375rem; }
  `]
})
export class TareasComponent implements OnInit {
  private cursoService = inject(CursoService);
  private tareaService = inject(TareaService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  cursos   = signal<Curso[]>([]);
  tareas   = signal<TareaDTO[]>([]);
  loading  = signal(false);
  saving   = signal(false);
  selectedCursoId: number | null = null;

  form = { titulo: '', descripcion: '', fechaEntrega: null as Date | null };

  cursoOptions = computed(() =>
    this.cursos().map(c => ({
      label: `${c.nombre} — ${c.nivel} Grado ${c.grados?.[0]} ${c.seccion ?? ''}`.trim(),
      value: c.id as number
    }))
  );

  ngOnInit() {
    this.cursoService.getMisCursos().subscribe(cursos => this.cursos.set(cursos));
  }

  onCursoChange() {
    if (!this.selectedCursoId) return;
    this.loading.set(true);
    this.tareaService.getByCurso(this.selectedCursoId).subscribe({
      next: (data) => { this.tareas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  crearTarea() {
    if (!this.selectedCursoId || !this.form.titulo.trim()) return;
    this.saving.set(true);

    const dto: TareaDTO = {
      cursoId: this.selectedCursoId,
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion.trim() || undefined,
      fechaEntrega: this.form.fechaEntrega
          ? this.form.fechaEntrega.toISOString().slice(0, 19)
          : undefined,
    };

    this.tareaService.create(dto).subscribe({
      next: (saved) => {
        this.tareas.update(list => [saved, ...list]);
        this.form = { titulo: '', descripcion: '', fechaEntrega: null };
        this.saving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Tarea creada' });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la tarea' });
      }
    });
  }

  confirmarEliminar(tarea: TareaDTO) {
    this.confirmationService.confirm({
      message: `¿Eliminár la tarea "${tarea.titulo}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      accept: () => this.eliminar(tarea),
    });
  }

  private eliminar(tarea: TareaDTO) {
    this.tareaService.delete(tarea.id!).subscribe({
      next: () => {
        this.tareas.update(list => list.filter(t => t.id !== tarea.id));
        this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Tarea eliminada' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
    });
  }
}
