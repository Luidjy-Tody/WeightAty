import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    NgIf,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required]],
  });

  showError(field: string, error?: string): boolean {
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty)) {
      return false;
    }
    return error ? control.hasError(error) : control.invalid;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.form.getRawValue()).subscribe({
      // La page d'accueil (features/home) appartient à un autre coéquipier.
      next: () => this.router.navigateByUrl('/home'),
      error: (err) => {
        this.errorMessage =
          err?.status === 401
            ? 'Adresse e-mail ou mot de passe incorrect.'
            : (err?.error?.message ?? 'Connexion impossible. Réessayez plus tard.');
        this.loading = false;
      },
    });
  }
}
