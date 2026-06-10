import { Component, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    MessageModule,
    SelectModule
  ],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  
  nombre = '';
  apellido = '';
  email = '';
  password = '';
  confirmPassword = '';
  rol: 'estudiante' | 'profesor' = 'estudiante';
  
  error = signal('');
  success = signal('');

  roles = [
    { label: 'Estudiante', value: 'estudiante' },
    { label: 'Profesor', value: 'profesor' }
  ];

  async onRegister(): Promise<void> {
    this.error.set('');
    this.success.set('');

    if (!this.nombre || !this.apellido || !this.email || !this.password) {
      this.error.set('Por favor completa todos los campos');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    const response = await this.authService.register({
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      password: this.password,
      rol: this.rol
    });
    
    if (response.success) {
      this.success.set(response.message || 'Cuenta creada exitosamente');
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 1500);
    } else {
      this.error.set(response.message || 'Error al crear la cuenta');
    }
  }
}