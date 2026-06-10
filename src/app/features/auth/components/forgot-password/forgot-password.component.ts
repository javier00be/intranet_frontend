import { Component, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  
  email = '';
  error = signal('');
  success = signal('');

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.success.set('');

    if (!this.email) {
      this.error.set('Por favor ingresa tu correo electrónico');
      return;
    }

    const response = await this.authService.forgotPassword(this.email);
    
    if (response.success) {
      this.success.set(response.message || 'Se ha enviado un enlace de recuperación a tu correo');
    } else {
      this.error.set(response.message || 'Error al procesar la solicitud');
    }
  }
}