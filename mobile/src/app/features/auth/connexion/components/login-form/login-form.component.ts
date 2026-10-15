import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon, IonInput, IonSpinner } from '@ionic/angular';
import type { LoginCredentials } from '../../../../../shared/models/user.model';
import { PasswordFieldComponent } from '../../../../../shared/components/password-field/password-field.component';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Formulaire de connexion (e-mail + mot de passe) avec sa validation. */
@Component({
  selector: 'app-login-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, IonInput, IonButton, IonIcon, IonSpinner, PasswordFieldComponent],
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent {
  /** Soumission en cours (bouton désactivé). */
  readonly loading = input(false);
  /** Message d'erreur renvoyé par le serveur. */
  readonly serverError = input<string | null>(null);

  /** Identifiants valides, transmis à la page. */
  readonly submitted = output<LoginCredentials>();

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  /** `true` après une première tentative d'envoi : affiche les erreurs. */
  private readonly showErrors = signal(false);

  private readonly formEvents: Signal<unknown>;
  private readonly passwordInput = viewChild(PasswordFieldComponent);

  /** Messages d'erreur français affichés sous chaque champ. */
  readonly messages = computed<Record<'email' | 'password', string | null>>(() => {
    this.formEvents();
    const showErrors = this.showErrors();
    const { email, password } = this.form.controls;

    const emailVisible = email.touched || showErrors;
    let emailMessage: string | null = null;
    if (emailVisible && email.errors) {
      emailMessage = email.hasError('required')
        ? "L'adresse e-mail est obligatoire."
        : "Le format de l'adresse e-mail est invalide.";
    }

    const passwordVisible = password.touched || showErrors;
    const passwordMessage =
      passwordVisible && password.hasError('required') ? 'Le mot de passe est obligatoire.' : null;

    return { email: emailMessage, password: passwordMessage };
  });

  constructor() {
    this.formEvents = toSignal(this.form.events, { initialValue: null });
  }

  /** Passe le focus au champ mot de passe depuis le champ e-mail. */
  focusPassword(event: Event): void {
    event.preventDefault();
    this.passwordInput()?.focus();
  }

  /** Valide puis transmet les identifiants à la page. */
  submit(): void {
    if (this.loading()) {
      return;
    }

    this.showErrors.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.submitted.emit({ email: email.trim(), password });
  }
}
