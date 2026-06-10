import { Component, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
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
    DividerModule,
    FloatLabelModule
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  
  email = '';
  password = '';
  error = signal('');

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Por favor ingresa correo y contraseña');
      return;
    }
    this.error.set('');
    const response = await this.authService.login(this.email, this.password);
    if (response.success) {
      const rol = response.user?.rol;
      if (rol === 'director') {
        this.router.navigate(['/director/dashboard']);
      } else if (rol === 'profesor') {
        this.router.navigate(['/profesor/dashboard']);
      } else if (rol === 'padre') {
        this.router.navigate(['/padre/dashboard']);
      } else if (rol === 'estudiante') {
        this.router.navigate(['/estudiante/cursos']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.error.set(response.message || 'Error al iniciar sesión');
    }
  }
}