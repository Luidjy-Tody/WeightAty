import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';

function motsDePasseIdentiques(group: AbstractControl): ValidationErrors | null {
  const mdp = group.get('motDePasse')?.value;
  const confirmation = group.get('confirmation')?.value;
  return mdp === confirmation ? null : { motsDePasseDifferents: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group(
    {
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9 +]{7,15}$/)]],
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      confirmation: ['', [Validators.required]],
    },
    { validators: motsDePasseIdentiques },
  );

  /** Vrai si le champ est invalide et déjà touché (pour afficher l'erreur). */
  showError(field: string, error?: string): boolean {
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty)) {
      return false;
    }
    return error ? control.hasError(error) : control.invalid;
  }

  get motsDePasseDifferents(): boolean {
    const confirmation = this.form.get('confirmation');
    return !!confirmation?.touched && this.form.hasError('motsDePasseDifferents');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    const { nom, prenom, email, telephone, motDePasse } = this.form.getRawValue();
    this.auth.register({ nom, prenom, email, telephone, motDePasse }).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: (err) => {
        this.errorMessage =
          err?.error?.message ?? "Impossible de créer le compte. Réessayez plus tard.";
        this.loading = false;
      },
    });
  }
}
