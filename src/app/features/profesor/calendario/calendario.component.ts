import { Component , ChangeDetectionStrategy } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profesor-calendario',
  standalone: true,
  imports: [CardModule],
  template: `
    <p-card header="Calendario">
      <p>Calendario académico y eventos.</p>
    </p-card>
  `
})
export class CalendarioComponent {}