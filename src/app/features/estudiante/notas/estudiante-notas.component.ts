import { Component , ChangeDetectionStrategy } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estudiante-notas',
  standalone: true,
  imports: [CardModule],
  template: `
    <p-card header="Mis Notas">
      <p>Ver mis calificaciones.</p>
    </p-card>
  `
})
export class EstudianteNotasComponent {}