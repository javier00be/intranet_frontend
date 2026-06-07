import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { PadreService, Padre, PadreFormOutput } from '../../../core/services/padre.service';
import { AuthService } from '../../../core/services/auth.service';
import { PadreFormComponent } from '../../../shared/components/padre-form/padre-form.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-padres',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, CardModule, ButtonModule,
    TagModule, AvatarModule, ProgressSpinnerModule,
    ToastModule, InputTextModule, PadreFormComponent, ModalComponent, ConfirmModalComponent
  ],
  providers: [MessageService],
  templateUrl: './padres.component.html',
  styleUrl: './padres.component.scss'
})
export class PadresComponent implements OnInit {
  private padreService = inject(PadreService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  displayCreate = false;
  displayEdit = false;
  displayAsignar = false;
  displayConfirm = false;
  pendingPadre: Padre | null = null;
  isLoading = signal<boolean>(true);
  padres: Padre[] = [];
  selectedPadre: Padre | null = null;
  hijoIdInput: number | null = null;

  ngOnInit() {
    this.loadPadres();
  }

  loadPadres() {
    this.isLoading.set(true);
    this.padreService.getAll().subscribe({
      next: (data) => { this.padres = data; this.isLoading.set(false); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los padres' });
        this.isLoading.set(false);
      }
    });
  }

  showCreateDialog() {
    this.selectedPadre = null;
    this.displayCreate = true;
  }

  showEditDialog(padre: Padre) {
    this.selectedPadre = padre;
    this.displayEdit = true;
  }

  showAsignarHijoDialog(padre: Padre) {
    this.selectedPadre = padre;
    this.hijoIdInput = null;
    this.displayAsignar = true;
  }

  async onCreatePadre(data: PadreFormOutput) {
    const regResult = await this.authService.adminRegisterUser({
      email: data.email,
      password: data.password!,
      nombre: data.nombre,
      apellido: data.apellido,
      rol: 'PADRE'
    });

    if (!regResult.success) {
      this.messageService.add({ severity: 'error', summary: 'Error al crear cuenta', detail: regResult.message });
      return;
    }

    this.padreService.create({
      usuario: { id: regResult.userId },
      telefono: data.telefono
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Padre registrado correctamente' });
        this.displayCreate = false;
        this.loadPadres();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el perfil del padre' });
      }
    });
  }

  onUpdatePadre(data: PadreFormOutput) {
    if (!this.selectedPadre) return;
    this.padreService.update(this.selectedPadre.id!, {
      usuario: { id: this.selectedPadre.usuario.id },
      telefono: data.telefono
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Padre actualizado' });
        this.displayEdit = false;
        this.loadPadres();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
      }
    });
  }

  onDeletePadre(id: number) {
    this.pendingPadre = this.padres.find(p => p.id === id) ?? null;
    this.displayConfirm = true;
  }

  executeDelete() {
    if (!this.pendingPadre?.id) return;
    this.padreService.delete(this.pendingPadre.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Padre desactivado' });
        this.pendingPadre = null;
        this.loadPadres();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar' });
      }
    });
  }

  onAddHijo() {
    if (!this.selectedPadre?.id || !this.hijoIdInput) return;
    this.padreService.addHijo(this.selectedPadre.id, this.hijoIdInput).subscribe({
      next: (updated) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estudiante asignado correctamente' });
        this.selectedPadre = updated;
        this.hijoIdInput = null;
        this.loadPadres();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo asignar el estudiante' });
      }
    });
  }

  onRemoveHijo(estudianteId: number) {
    if (!this.selectedPadre?.id) return;
    this.padreService.removeHijo(this.selectedPadre.id, estudianteId).subscribe({
      next: (updated) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estudiante removido' });
        this.selectedPadre = updated;
        this.loadPadres();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo remover el estudiante' });
      }
    });
  }

  getIniciales(padre: Padre): string {
    const n = padre.usuario?.nombre?.[0] ?? '';
    const a = padre.usuario?.apellido?.[0] ?? '';
    return `${n}${a}`.toUpperCase() || '?';
  }
}
