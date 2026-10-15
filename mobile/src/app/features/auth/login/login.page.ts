import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [IonContent, ReactiveFormsModule],
})
export class LoginPage {
  readonly showPassword = signal(false);
  readonly toastMessage = signal<string | null>(null);

  readonly loginForm: FormGroup = inject(FormBuilder).group({
    email: [''],
    password: [''],
  });

  private readonly router = inject(Router);

  private toastTimer?: ReturnType<typeof setTimeout>;

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    this.router.navigateByUrl('/home');
  }

  loginAs(email: string): void {
    this.loginForm.patchValue({ email, password: 'demo' });
    this.router.navigateByUrl('/home');
  }

  onForgotPassword(): void {
    this.showComingSoon();
  }

  onSignUp(): void {
    this.showComingSoon();
  }

  private showComingSoon(): void {
    this.toastMessage.set('Fonctionnalité bientôt disponible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 2500);
  }
}
