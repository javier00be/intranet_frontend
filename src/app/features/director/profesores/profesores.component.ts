import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProfesorService, Profesor } from '../../../core/services/profesor.service';
import { ProfesorFormComponent } from '../../../shared/components/profesor-form/profesor-form.component';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    AvatarModule,
    ProgressSpinnerModule,
    ToastModule,
    ProfesorFormComponent
  ],
  providers: [MessageService],
  template: `
    <div class="page-container">
      <p-toast />
      <div class="header">
        <div class="title-section">
          <h1>Gestión de Profesores</h1>
          <p class="subtitle">Administra el personal docente y sus especialidades</p>
        </div>
        <div class="actions">
          <p-button label="Nuevo Profesor" icon="pi pi-user-plus" (click)="showDialog()" />
        </div>
      </div>

      <p-card>
        <div *ngIf="isLoading()" class="flex justify-center p-8">
          <p-progressspinner styleClass="w-16 h-16" strokeWidth="4" fill="transparent" animationDuration=".5s" />
        </div>

        <p-table 
          *ngIf="!isLoading()"
          [value]="profesores" 
          [paginator]="true" 
          [rows]="10"
          styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Profesor</th>
              <th>Especialidad</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-profe>
            <tr>
              <td>
                <div class="profe-cell">
                  <p-avatar [label]="getIniciales(profe)" shape="circle" size="large" [style]="{'background-color': '#6366f1', 'color': '#ffffff'}" />
                  <div class="profe-info">
                    <span class="profe-name">{{ profe.nombre }} {{ profe.apellido }}</span>
                    <span class="profe-id">ID: {{ profe.id }}</span>
                  </div>
                </div>
              </td>
              <td>
                <p-tag [value]="profe.especialidad" severity="secondary" />
              </td>
              <td>
                <div class="contact-cell">
                  <span><i class="pi pi-envelope mr-2"></i>{{ profe.email }}</span>
                  <span><i class="pi pi-phone mr-2"></i>{{ profe.telefono }}</span>
                </div>
              </td>
              <td>
                <p-tag [value]="profe.estado" [severity]="profe.estado === 'Activo' ? 'success' : 'warn'" />
              </td>
              <td>
                <div class="table-actions">
                  <p-button icon="pi pi-pencil" severity="secondary" rounded text />
                  <p-button icon="pi pi-calendar" severity="secondary" rounded text />
                  <p-button icon="pi pi-trash" severity="danger" rounded text (click)="onDeleteProfe(profe.id!)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center p-8">No se encontraron profesores registrados.</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <p-dialog header="Registrar Profesor" [(visible)]="display" [modal]="true" [style]="{ width: '550px' }">
        <app-profesor-form (save)="onSaveProfe($event)" (cancel)="display = false" />
      </p-dialog>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-section h1 {
      font-size: 1.75rem;
      margin: 0;
      color: #111827;
    }

    .subtitle {
      color: #6b7280;
      margin: 0.25rem 0 0;
    }

    .profe-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .profe-info {
      display: flex;
      flex-direction: column;
    }

    .profe-name {
      font-weight: 600;
      color: #111827;
    }

    .profe-id {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .contact-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .table-actions {
      display: flex;
      gap: 0.15rem;
    }

    .flex { display: flex; }
    .justify-center { justify-content: center; }
    .p-8 { padding: 2rem; }
    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }

    /* Dark mode */
    :host-context(.dark-mode) .title-section h1,
    :host-context(.dark-mode) .profe-name {
      color: #f9fafb;
    }
    
    :host-context(.dark-mode) .contact-cell {
      color: #9ca3af;
    }
  `]
})
export class ProfesoresComponent implements OnInit {
  private profesorService = inject(ProfesorService);
  private messageService = inject(MessageService);

  display: boolean = false;
  isLoading = signal<boolean>(true);
  profesores: Profesor[] = [];

  ngOnInit() {
    this.loadProfesores();
  }

  loadProfesores() {
    this.isLoading.set(true);
    this.profesorService.getAll().subscribe({
      next: (data) => {
        this.profesores = data;
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los profesores' });
        this.isLoading.set(false);
      }
    });
  }

  onSaveProfe(profe: Profesor) {
    this.profesorService.create(profe).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Profesor registrado correctamente' });
        this.display = false;
        this.loadProfesores();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el profesor' });
      }
    });
  }

  onDeleteProfe(id: number) {
    if (confirm('¿Estás seguro de eliminar este profesor?')) {
      this.profesorService.delete(id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Profesor eliminado' });
          this.loadProfesores();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el profesor' });
        }
      });
    }
  }

  getIniciales(profe: Profesor): string {
    return `${profe.nombre.charAt(0)}${profe.apellido.charAt(0)}`.toUpperCase();
  }

  showDialog() {
    this.display = true;
  }
}