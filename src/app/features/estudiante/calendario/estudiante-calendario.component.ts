import { Component , ChangeDetectionStrategy } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estudiante-calendario',
  standalone: true,
  imports: [CardModule],
  template: `
    <p-card header="Calendario">
      <p>Mi calendario académico.</p>
    </p-card>
  `
})
export class EstudianteCalendarioComponent {}