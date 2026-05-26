import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ProfesorService, Profesor, ProfesorFormOutput } from '../../../core/services/profesor.service';
import { CursoService, Curso } from '../../../core/services/curso.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProfesorFormComponent } from '../../../shared/components/profesor-form/profesor-form.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, CardModule, ButtonModule,
    TagModule, AvatarModule, ProgressSpinnerModule, ToastModule,
    CheckboxModule, TooltipModule, ProfesorFormComponent, ModalComponent, ConfirmModalComponent
  ],
  providers: [MessageService],
  template: `
    <div class="page-container">
      <p-toast />

      <div class="header">
        <div class="title-section">
          <h1>Gestión de Profesores</h1>
          <p class="subtitle">Administrá el personal docente y asigná sus cursos</p>
        </div>
        <p-button label="Nuevo Profesor" icon="pi pi-user-plus" (click)="showCreateDialog()" />
      </div>

      <p-card>
        <div *ngIf="isLoading()" class="flex justify-center p-8">
          <p-progressspinner styleClass="w-16 h-16" />
        </div>

        <p-table *ngIf="!isLoading()" [value]="profesores" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Profesor</th>
              <th>Especialidad</th>
              <th>Contacto</th>
              <th>Cursos asignados</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-profe>
            <tr>
              <td>
                <div class="profe-cell">
                  <p-avatar [label]="getIniciales(profe)" shape="circle" size="large"
                    [style]="{'background-color': '#6366f1', 'color': '#ffffff'}" />
                  <div class="profe-info">
                    <span class="profe-name">{{ profe.usuario?.nombre }} {{ profe.usuario?.apellido }}</span>
                    <span class="profe-email">{{ profe.usuario?.email }}</span>
                  </div>
                </div>
              </td>
              <td><p-tag [value]="profe.especialidad" severity="secondary" /></td>
              <td><span class="contact"><i class="pi pi-phone"></i> {{ profe.telefono }}</span></td>
              <td>
                <span class="cursos-count" [class.none]="cursosDeProfesor(profe.id!).length === 0">
                  {{ cursosDeProfesor(profe.id!).length }} curso{{ cursosDeProfesor(profe.id!).length !== 1 ? 's' : '' }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <p-button icon="pi pi-book" severity="info" rounded text (click)="showCursosDialog(profe)" pTooltip="Asignar cursos" tooltipPosition="top" />
                  <p-button icon="pi pi-pencil" severity="secondary" rounded text (click)="showEditDialog(profe)" pTooltip="Editar" tooltipPosition="top" />
                  <p-button icon="pi pi-ban" severity="danger" rounded text (click)="onDeleteProfe(profe.id!)" pTooltip="Desactivar" tooltipPosition="top" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="5" class="text-center p-8">No hay profesores registrados.</td></tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Modal crear -->
      <app-modal [(visible)]="displayCreate" title="Registrar Profesor" subtitle="Creá la cuenta y el perfil del docente">
        @if (displayCreate) {
          <app-profesor-form [profesor]="null" (save)="onCreateProfe($event)" (cancel)="displayCreate = false" />
        }
      </app-modal>

      <!-- Modal editar -->
      <app-modal
        [(visible)]="displayEdit"
        title="Editar Profesor"
        [subtitle]="(selectedProfe?.usuario?.nombre ?? '') + ' ' + (selectedProfe?.usuario?.apellido ?? '')">
        @if (displayEdit) {
          <app-profesor-form [profesor]="selectedProfe" (save)="onUpdateProfe($event)" (cancel)="displayEdit = false" />
        }
      </app-modal>

      <!-- Modal confirmar desactivación -->
      <app-confirm-modal
        [(visible)]="displayConfirm"
        title="Desactivar profesor"
        [message]="'¿Desactivar a ' + (pendingProfe?.usuario?.nombre ?? '') + ' ' + (pendingProfe?.usuario?.apellido ?? '') + '? Ya no aparecerá en el sistema.'"
        confirmLabel="Desactivar"
        (confirm)="executeDelete()"
        (cancel)="displayConfirm = false" />

      <!-- Modal asignar cursos -->
      <app-modal
        [(visible)]="displayCursos"
        title="Cursos asignados"
        [subtitle]="(selectedProfe?.usuario?.nombre ?? '') + ' · ' + (selectedProfe?.especialidad ?? '')"
        width="540px">
        @if (displayCursos) {
          @if (loadingCursos()) {
            <div class="flex justify-center p-8"><p-progressspinner styleClass="w-10 h-10" /></div>
          } @else {
            <div class="cursos-list">
              @if (todosLosCursos.length === 0) {
                <p class="empty-msg">No hay cursos creados todavía.</p>
              }
              @for (curso of todosLosCursos; track curso.id) {
                <label class="curso-row" [class.selected]="isCursoSelected(curso.id!)">
                  <p-checkbox [binary]="true" [ngModel]="isCursoSelected(curso.id!)" (ngModelChange)="toggleCurso(curso, $event)" />
                  <div class="curso-row-info">
                    <span class="curso-row-nombre">{{ curso.nombre }}</span>
                    <span class="curso-row-meta">
                      <span class="nivel-dot" [style.background]="nivelColor(curso.nivel)"></span>
                      {{ nivelLabel(curso.nivel) }} · {{ curso.grados?.join('°, ') }}° {{ curso.seccion ?? '' }}
                      @if (curso.profesorId && curso.profesorId !== selectedProfe?.id) {
                        <span class="otro-prof"> · asignado a otro docente</span>
                      }
                    </span>
                  </div>
                </label>
              }
            </div>

            <div class="asignar-footer">
              <span class="selected-count">{{ cursosSeleccionados.size }} seleccionado{{ cursosSeleccionados.size !== 1 ? 's' : '' }}</span>
              <div class="footer-btns">
                <p-button label="Cancelar" severity="secondary" [text]="true" (click)="displayCursos = false" />
                <p-button label="Guardar asignación" icon="pi pi-check" [loading]="guardandoCursos()" (click)="guardarAsignacion()" />
              </div>
            </div>
          }
        }
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .title-section h1 { font-size: 1.75rem; margin: 0; color: #111827; }
    .subtitle { color: #6b7280; margin: 0.25rem 0 0; font-size: 0.875rem; }
    .profe-cell { display: flex; align-items: center; gap: 1rem; }
    .profe-info { display: flex; flex-direction: column; }
    .profe-name { font-weight: 600; color: #111827; }
    .profe-email { font-size: 0.75rem; color: #6b7280; }
    .contact { font-size: 0.875rem; color: #6b7280; display: flex; align-items: center; gap: 0.375rem; }
    .cursos-count { font-size: 0.8125rem; font-weight: 500; color: #6366f1; }
    .cursos-count.none { color: #d1d5db; }
    .table-actions { display: flex; gap: 0.15rem; }
    .flex { display: flex; } .justify-center { justify-content: center; }
    .p-8 { padding: 2rem; } .w-16 { width: 4rem; } .h-16 { height: 4rem; }
    .w-10 { width: 2.5rem; } .h-10 { height: 2.5rem; }

    .cursos-list { max-height: 340px; overflow-y: auto; padding: 0.5rem 0; }

    .curso-row {
      display: flex; align-items: center; gap: 0.875rem;
      padding: 0.75rem 1.75rem; cursor: pointer; transition: background 0.12s;
    }
    .curso-row:hover { background: #f9fafb; }
    .curso-row.selected { background: #f5f3ff; }

    .curso-row-info { display: flex; flex-direction: column; gap: 0.125rem; flex: 1; }
    .curso-row-nombre { font-size: 0.875rem; font-weight: 500; color: #111827; }
    .curso-row-meta { font-size: 0.75rem; color: #9ca3af; display: flex; align-items: center; gap: 0.375rem; }
    .nivel-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .otro-prof { color: #fbbf24; }
    .empty-msg { padding: 2rem; text-align: center; color: #9ca3af; font-size: 0.875rem; }

    .asignar-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.875rem 1.75rem; border-top: 1px solid #f3f4f6;
    }
    .selected-count { font-size: 0.8125rem; color: #6b7280; }
    .footer-btns { display: flex; gap: 0.5rem; }

    :host-context(.dark-mode) .title-section h1, :host-context(.dark-mode) .profe-name, :host-context(.dark-mode) .curso-row-nombre { color: #f9fafb; }
    :host-context(.dark-mode) .curso-row:hover { background: #334155; }
    :host-context(.dark-mode) .curso-row.selected { background: #312e81; }
    :host-context(.dark-mode) .asignar-footer { border-color: #334155; }
  `]
})
export class ProfesoresComponent implements OnInit {
  private profesorService = inject(ProfesorService);
  private cursoService = inject(CursoService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  displayCreate = false;
  displayEdit = false;
  displayCursos = false;
  displayConfirm = false;
  pendingProfe: Profesor | null = null;
  isLoading = signal(true);
  loadingCursos = signal(false);
  guardandoCursos = signal(false);

  profesores: Profesor[] = [];
  todosLosCursos: Curso[] = [];
  selectedProfe: Profesor | null = null;
  cursosSeleccionados = new Set<number>();

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.isLoading.set(true);
    forkJoin({ profesores: this.profesorService.getAll(), cursos: this.cursoService.getAll() }).subscribe({
      next: ({ profesores, cursos }) => { this.profesores = profesores; this.todosLosCursos = cursos; this.isLoading.set(false); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos' }); this.isLoading.set(false); }
    });
  }

  cursosDeProfesor(profesorId: number): Curso[] { return this.todosLosCursos.filter(c => c.profesorId === profesorId); }

  showCreateDialog() { this.displayCreate = true; }

  showEditDialog(profe: Profesor) { this.selectedProfe = profe; this.displayEdit = true; }

  showCursosDialog(profe: Profesor) {
    this.selectedProfe = profe;
    this.cursosSeleccionados = new Set(this.todosLosCursos.filter(c => c.profesorId === profe.id).map(c => c.id!));
    this.displayCursos = true;
  }

  isCursoSelected(cursoId: number): boolean { return this.cursosSeleccionados.has(cursoId); }

  toggleCurso(curso: Curso, selected: boolean) {
    selected ? this.cursosSeleccionados.add(curso.id!) : this.cursosSeleccionados.delete(curso.id!);
  }

  guardarAsignacion() {
    if (!this.selectedProfe?.id) return;
    const profesorId = this.selectedProfe.id;
    const updates = this.todosLosCursos
      .filter(c => this.cursosSeleccionados.has(c.id!) !== (c.profesorId === profesorId))
      .map(c => this.cursoService.update(c.id!, { ...c, profesorId: this.cursosSeleccionados.has(c.id!) ? profesorId : undefined }));

    if (!updates.length) { this.displayCursos = false; return; }

    this.guardandoCursos.set(true);
    forkJoin(updates).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cursos asignados correctamente' }); this.guardandoCursos.set(false); this.displayCursos = false; this.loadAll(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la asignación' }); this.guardandoCursos.set(false); }
    });
  }

  async onCreateProfe(data: ProfesorFormOutput) {
    const reg = await this.authService.adminRegisterUser({ email: data.email, password: data.password!, nombre: data.nombre, apellido: data.apellido, rol: 'PROFESOR' });
    if (!reg.success) { this.messageService.add({ severity: 'error', summary: 'Error', detail: reg.message }); return; }
    this.profesorService.create({ usuario: { id: reg.userId }, especialidad: data.especialidad, telefono: data.telefono }).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Profesor registrado' }); this.displayCreate = false; this.loadAll(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el perfil' }); }
    });
  }

  onUpdateProfe(data: ProfesorFormOutput) {
    if (!this.selectedProfe) return;
    this.profesorService.update(this.selectedProfe.id!, { usuario: { id: this.selectedProfe.usuario.id }, especialidad: data.especialidad, telefono: data.telefono }).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Profesor actualizado' }); this.displayEdit = false; this.loadAll(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }); }
    });
  }

  onDeleteProfe(id: number) {
    this.pendingProfe = this.profesores.find(p => p.id === id) ?? null;
    this.displayConfirm = true;
  }

  executeDelete() {
    if (!this.pendingProfe?.id) return;
    this.profesorService.delete(this.pendingProfe.id).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Profesor desactivado' }); this.pendingProfe = null; this.loadAll(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar' }); }
    });
  }

  getIniciales(profe: Profesor): string { return `${profe.usuario?.nombre?.[0] ?? ''}${profe.usuario?.apellido?.[0] ?? ''}`.toUpperCase() || '?'; }
  nivelColor(nivel: string): string { return ({ INICIAL: '#f59e0b', PRIMARIA: '#6366f1', SECUNDARIA: '#10b981' } as any)[nivel] ?? '#9ca3af'; }
  nivelLabel(nivel: string): string { return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel; }
}
