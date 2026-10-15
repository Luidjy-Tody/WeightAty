import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import { apiErrorMessage, apiFieldErrors } from '../../../shared/models/api-error.model';
import { PasswordFieldComponent } from '../../../shared/components/password-field/password-field.component';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import { passwordStrength } from '../../../shared/utils/password-strength';

/** Longueurs alignées sur la règle d'inscription. */
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/** La confirmation doit être identique au nouveau mot de passe. */
const passwordsMatchValidator: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const newPassword = String(group.get('newPassword')?.value ?? '');
  const confirmPassword = String(group.get('confirmPassword')?.value ?? '');

  if (newPassword === '' || confirmPassword === '') {
    return null;
  }

  return newPassword === confirmPassword ? null : { passwordsMismatch: true };
};

/** Sous-écran « Sécurité du compte » : changement de mot de passe. */
@Component({
  selector: 'app-securite',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonButton,
    IonSpinner,
    PasswordFieldComponent,
    RoundIconButtonComponent,
  ],
  templateUrl: './securite.page.html',
  styleUrls: ['./securite.page.scss'],
})
export class SecuritePage {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(MIN_PASSWORD_LENGTH),
          Validators.maxLength(MAX_PASSWORD_LENGTH),
        ],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatchValidator }
  );

  private readonly formEvents: Signal<unknown>;

  readonly strength = computed(() => {
    this.formEvents();
    return passwordStrength(this.form.controls.newPassword.value);
  });

  readonly canSubmit = computed(() => {
    this.formEvents();
    return this.form.valid && !this.saving();
  });

  /** Messages d'erreur français affichés sous chaque champ. */
  readonly messages = computed<Record<string, string | null>>(() => {
    this.formEvents();

    return {
      currentPassword: this.messageFor('currentPassword'),
      newPassword: this.messageFor('newPassword'),
      confirmPassword: this.messageFor('confirmPassword'),
    };
  });

  constructor() {
    this.formEvents = toSignal(this.form.events, { initialValue: null });
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/parametres']);
  }

  /** Enregistre le nouveau mot de passe. */
  submit(): void {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.serverError.set(null);

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: async ({ token }) => {
        this.saving.set(false);
        // Le serveur invalide les autres sessions : on conserve la session
        // courante avec le nouveau jeton.
        this.auth.updateToken(token);
        this.form.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
        this.form.markAsPristine();
        await this.notifications.success('Mot de passe mis à jour');
      },
      error: (error: unknown) => {
        this.saving.set(false);

        const details = apiFieldErrors(error);
        if (Object.keys(details).length > 0) {
          for (const [field, message] of Object.entries(details)) {
            const control = this.form.get(field);
            if (control) {
              control.setErrors({ server: message });
              control.markAsTouched();
            }
          }
          return;
        }

        this.serverError.set(
          apiErrorMessage(error, 'Le changement de mot de passe a échoué. Réessayez.')
        );
      },
    });
  }

  private messageFor(field: string): string | null {
    const control = this.form.get(field);

    // Le bouton « Enregistrer » étant désactivé tant que le formulaire est
    // invalide, les messages apparaissent dès la saisie (champ modifié) ou
    // après interaction, afin que l'utilisateur comprenne ce qui bloque.
    if (!control || (!control.touched && !control.dirty)) {
      return null;
    }

    const errors = control.errors ?? {};

    if (typeof errors['server'] === 'string') {
      return errors['server'];
    }

    switch (field) {
      case 'currentPassword':
        return errors['required'] ? 'Le mot de passe actuel est obligatoire.' : null;
      case 'newPassword':
        if (errors['required']) {
          return 'Le nouveau mot de passe est obligatoire.';
        }
        if (errors['minlength']) {
          return `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
        }
        if (errors['maxlength']) {
          return `Le nouveau mot de passe ne doit pas dépasser ${MAX_PASSWORD_LENGTH} caractères.`;
        }
        return null;
      case 'confirmPassword':
        // Erreur portée par le groupe (les deux mots de passe diffèrent).
        if (this.form.hasError('passwordsMismatch')) {
          return 'Les deux mots de passe ne correspondent pas.';
        }
        return errors['required'] ? 'La confirmation du mot de passe est obligatoire.' : null;
      default:
        return null;
    }
  }
}
