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
  template: `
    <div class="page-container">
      <p-toast />
      <div class="header">
        <div class="title-section">
          <h1>Gestión de Padres</h1>
          <p class="subtitle">Administra los padres de familia y la asignación de sus hijos</p>
        </div>
        <div class="actions">
          <p-button label="Nuevo Padre" icon="pi pi-user-plus" (click)="showCreateDialog()" />
        </div>
      </div>

      <p-card>
        <div *ngIf="isLoading()" class="flex justify-center p-8">
          <p-progressspinner styleClass="w-16 h-16" strokeWidth="4" fill="transparent" animationDuration=".5s" />
        </div>

        <p-table
          *ngIf="!isLoading()"
          [value]="padres"
          [paginator]="true"
          [rows]="10"
          styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Padre / Madre</th>
              <th>Teléfono</th>
              <th>Hijos asignados</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-padre>
            <tr>
              <td>
                <div class="padre-cell">
                  <p-avatar [label]="getIniciales(padre)" shape="circle" size="large"
                    [style]="{'background-color': '#10b981', 'color': '#ffffff'}" />
                  <div class="padre-info">
                    <span class="padre-name">{{ padre.usuario?.nombre }} {{ padre.usuario?.apellido }}</span>
                    <span class="padre-email">{{ padre.usuario?.email }}</span>
                  </div>
                </div>
              </td>
              <td>{{ padre.telefono }}</td>
              <td>
                <p-tag [value]="(padre.hijoIds?.length ?? 0) + ' hijo(s)'"
                  [severity]="(padre.hijoIds?.length ?? 0) > 0 ? 'success' : 'warn'" />
              </td>
              <td>
                <div class="table-actions">
                  <p-button icon="pi pi-pencil" severity="secondary" rounded text
                    (click)="showEditDialog(padre)" pTooltip="Editar" />
                  <p-button icon="pi pi-link" severity="info" rounded text
                    (click)="showAsignarHijoDialog(padre)" pTooltip="Asignar hijo" />
                  <p-button icon="pi pi-ban" severity="danger" rounded text
                    (click)="onDeletePadre(padre.id!)" pTooltip="Desactivar" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="text-center p-8">No se encontraron padres registrados.</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Modal confirmar desactivación -->
      <app-confirm-modal
        [(visible)]="displayConfirm"
        title="Desactivar padre de familia"
        [message]="'¿Desactivar a ' + (pendingPadre?.usuario?.nombre ?? '') + ' ' + (pendingPadre?.usuario?.apellido ?? '') + '? Ya no aparecerá en el sistema.'"
        confirmLabel="Desactivar"
        (confirm)="executeDelete()"
        (cancel)="displayConfirm = false" />

      <!-- Modal Crear -->
      <app-modal [(visible)]="displayCreate" title="Registrar Padre de Familia" subtitle="Creá la cuenta y el perfil del padre">
        @if (displayCreate) {
          <app-padre-form [padre]="null" (save)="onCreatePadre($event)" (cancel)="displayCreate = false" />
        }
      </app-modal>

      <!-- Modal Editar -->
      <app-modal
        [(visible)]="displayEdit"
        title="Editar Padre de Familia"
        [subtitle]="(selectedPadre?.usuario?.nombre ?? '') + ' ' + (selectedPadre?.usuario?.apellido ?? '')">
        @if (displayEdit) {
          <app-padre-form [padre]="selectedPadre" (save)="onUpdatePadre($event)" (cancel)="displayEdit = false" />
        }
      </app-modal>

      <!-- Modal Asignar Hijo -->
      <app-modal
        [(visible)]="displayAsignar"
        title="Asignar Estudiante"
        [subtitle]="(selectedPadre?.usuario?.nombre ?? '') + ' ' + (selectedPadre?.usuario?.apellido ?? '')"
        width="420px">
        @if (displayAsignar) {
          <div class="hijo-body">
            <p class="hijo-hint">Ingresá el ID del estudiante para asignarlo a este padre.</p>
            <div class="hijo-field">
              <label>ID del Estudiante</label>
              <input pInputText type="number" [(ngModel)]="hijoIdInput" placeholder="Ej: 5" />
            </div>
            @if ((selectedPadre?.hijoIds?.length ?? 0) > 0) {
              <div class="hijo-field">
                <label>Hijos actuales</label>
                <div class="hijos-chips">
                  @for (hId of selectedPadre?.hijoIds ?? []; track hId) {
                    <span class="hijo-chip">
                      ID: {{ hId }}
                      <button class="chip-remove" (click)="onRemoveHijo(hId)"><i class="pi pi-times"></i></button>
                    </span>
                  }
                </div>
              </div>
            }
            <div class="hijo-footer">
              <p-button label="Cancelar" severity="secondary" [text]="true" (click)="displayAsignar = false" />
              <p-button label="Asignar" icon="pi pi-link" [disabled]="!hijoIdInput" (click)="onAddHijo()" />
            </div>
          </div>
        }
      </app-modal>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .title-section h1 { font-size: 1.75rem; margin: 0; color: #111827; }
    .subtitle { color: #6b7280; margin: 0.25rem 0 0; }
    .actions { display: flex; gap: 0.75rem; }
    .padre-cell { display: flex; align-items: center; gap: 1rem; }
    .padre-info { display: flex; flex-direction: column; }
    .padre-name { font-weight: 600; color: #111827; }
    .padre-email { font-size: 0.75rem; color: #6b7280; }
    .table-actions { display: flex; gap: 0.15rem; }
    .flex { display: flex; }
    .justify-center { justify-content: center; }
    .p-8 { padding: 2rem; }
    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }
    .flex-wrap { flex-wrap: wrap; }
    .hijo-body { padding: 1.5rem 1.75rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .hijo-hint { font-size: 0.8125rem; color: #9ca3af; margin: 0; }
    .hijo-field { display: flex; flex-direction: column; gap: 0.375rem; }
    .hijo-field label { font-size: 0.8125rem; font-weight: 500; color: #374151; }
    .hijo-field input { width: 100%; border-radius: 8px; font-size: 0.875rem; }
    .hijos-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .hijo-chip {
      display: inline-flex; align-items: center; gap: 0.375rem;
      background: #e0e7ff; color: #4338ca; font-size: 0.75rem; font-weight: 600;
      padding: 0.2rem 0.6rem; border-radius: 20px;
    }
    .chip-remove {
      background: none; border: none; cursor: pointer; color: #6366f1;
      padding: 0; display: flex; align-items: center; font-size: 0.65rem;
    }
    .hijo-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.5rem; }

    :host-context(.dark-mode) .title-section h1,
    :host-context(.dark-mode) .padre-name { color: #f9fafb; }
    :host-context(.dark-mode) .hijo-field label { color: #cbd5e1; }
    :host-context(.dark-mode) .hijo-chip { background: #312e81; color: #a5b4fc; }
  `]
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
