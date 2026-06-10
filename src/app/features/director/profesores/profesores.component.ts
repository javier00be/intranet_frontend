import { Component, OnInit, inject, signal , ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profesores',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, CardModule, ButtonModule,
    TagModule, AvatarModule, ProgressSpinnerModule, ToastModule,
    CheckboxModule, TooltipModule, ProfesorFormComponent, ModalComponent, ConfirmModalComponent
  ],
  providers: [MessageService],
  templateUrl: './profesores.component.html',
  styleUrl: './profesores.component.scss'
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

  cursosDeProfesor(profesorId: number): Curso[] { return this.todosLosCursos.filter(c => c.profesorIds?.includes(profesorId) ?? false); }

  showCreateDialog() { this.displayCreate = true; }

  showEditDialog(profe: Profesor) { this.selectedProfe = profe; this.displayEdit = true; }

  showCursosDialog(profe: Profesor) {
    this.selectedProfe = profe;
    this.cursosSeleccionados = new Set(
      this.todosLosCursos.filter(c => c.profesorIds?.includes(profe.id!) ?? false).map(c => c.id!)
    );
    this.displayCursos = true;
  }

  isCursoSelected(cursoId: number): boolean { return this.cursosSeleccionados.has(cursoId); }

  toggleCurso(curso: Curso, selected: boolean) {
    selected ? this.cursosSeleccionados.add(curso.id!) : this.cursosSeleccionados.delete(curso.id!);
  }

  guardarAsignacion() {
    if (!this.selectedProfe?.id) return;
    this.guardandoCursos.set(true);
    this.profesorService.assignCursos(this.selectedProfe.id, Array.from(this.cursosSeleccionados)).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cursos asignados correctamente' });
        this.guardandoCursos.set(false);
        this.displayCursos = false;
        this.loadAll();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la asignación' });
        this.guardandoCursos.set(false);
      }
    });
  }

  async onCreateProfe(data: ProfesorFormOutput) {
    const reg = await this.authService.adminRegisterUser({ email: data.email, password: data.password!, nombre: data.nombre, apellido: data.apellido, rol: 'PROFESOR' });
    if (!reg.success) { this.messageService.add({ severity: 'error', summary: 'Error', detail: reg.message }); return; }
    this.profesorService.create({ usuario: { id: reg.userId }, telefono: data.telefono }).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Profesor registrado' }); this.displayCreate = false; this.loadAll(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el perfil' }); }
    });
  }

  onUpdateProfe(data: ProfesorFormOutput) {
    if (!this.selectedProfe) return;
    this.profesorService.update(this.selectedProfe.id!, { usuario: { id: this.selectedProfe.usuario.id }, telefono: data.telefono }).subscribe({
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

  get cursosPorNivel(): { nivel: string; label: string; color: string; cursos: Curso[] }[] {
    const order = [
      { nivel: 'INICIAL',    label: 'Inicial',    color: '#f59e0b' },
      { nivel: 'PRIMARIA',   label: 'Primaria',   color: '#6366f1' },
      { nivel: 'SECUNDARIA', label: 'Secundaria', color: '#10b981' },
    ];
    return order
      .map(n => ({ ...n, cursos: this.todosLosCursos.filter(c => c.nivel === n.nivel) }))
      .filter(n => n.cursos.length > 0);
  }

  getIniciales(profe: Profesor): string { return `${profe.usuario?.nombre?.[0] ?? ''}${profe.usuario?.apellido?.[0] ?? ''}`.toUpperCase() || '?'; }
  nivelColor(nivel: string): string { return ({ INICIAL: '#f59e0b', PRIMARIA: '#6366f1', SECUNDARIA: '#10b981' } as any)[nivel] ?? '#9ca3af'; }
  nivelLabel(nivel: string): string { return ({ INICIAL: 'Inicial', PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria' } as any)[nivel] ?? nivel; }
}
