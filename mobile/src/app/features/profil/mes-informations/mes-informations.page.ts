import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
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
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import type { PendingChangesAware } from '../../../core/guards/unsaved-changes.guard';
import {
  API_UNREACHABLE_MESSAGE,
  apiErrorMessage,
  apiFieldErrors,
  isApiUnreachable,
} from '../../../shared/models/api-error.model';
import type { UpdateProfilePayload } from '../../../shared/models/user.model';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import {
  MAX_PHOTO_FILE_BYTES,
  isSupportedPhoto,
  processProfilePhoto,
} from '../../../shared/utils/image';
import { normalizePhone } from '../../../shared/utils/user-format';
import { ProfileHeaderCardComponent } from '../components/profile-header-card/profile-header-card.component';

/** Limites alignées sur la validation serveur. */
const MIN_FULL_NAME = 2;
const MAX_FULL_NAME = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_ADDRESS_LENGTH = 200;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Numéro international normalisé : « + » optionnel puis 6 à 15 chiffres. */
const PHONE_PATTERN = /^\+?[0-9]{6,15}$/;

/** Champs du formulaire, dans l'ordre visuel. */
const FIELD_ORDER = ['fullName', 'email', 'phone', 'address'] as const;
type FieldName = (typeof FIELD_ORDER)[number];

/** Nom complet obligatoire, 2 à 100 caractères. */
const fullNameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return { required: true };
  }
  if (value.length < MIN_FULL_NAME) {
    return { nameMin: { min: MIN_FULL_NAME } };
  }
  if (value.length > MAX_FULL_NAME) {
    return { nameMax: { max: MAX_FULL_NAME } };
  }

  return null;
};

/** Format de l'e-mail (le caractère obligatoire est géré par `Validators.required`). */
const emailValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  return value.length === 0 || EMAIL_PATTERN.test(value) ? null : { emailFormat: true };
};

/** Format du téléphone, validé après normalisation (champ facultatif). */
const phoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  return value.length === 0 || PHONE_PATTERN.test(normalizePhone(value))
    ? null
    : { phoneFormat: true };
};

/** Écran « Mes informations » : identité, coordonnées et photo de profil. */
@Component({
  selector: 'app-mes-informations',
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
    FormFieldComponent,
    ProfileHeaderCardComponent,
    RoundIconButtonComponent,
  ],
  templateUrl: './mes-informations.page.html',
  styleUrls: ['./mes-informations.page.scss'],
})
export class MesInformationsPage implements PendingChangesAware {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly loadErrorMessage = signal('Impossible de charger vos informations.');
  readonly saving = signal(false);

  /** Photo enregistrée côté serveur. */
  readonly photoUrl = signal<string | null>(null);
  /** Aperçu local immédiat pendant l'envoi. */
  readonly photoPreview = signal<string | null>(null);
  readonly photoBusy = signal(false);

  readonly form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [fullNameValidator] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(MAX_EMAIL_LENGTH), emailValidator],
    }),
    phone: new FormControl('', { nonNullable: true, validators: [phoneValidator] }),
    address: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(MAX_ADDRESS_LENGTH)],
    }),
  });

  private readonly formEvents: Signal<unknown>;
  private readonly photoInput = viewChild<ElementRef<HTMLInputElement>>('photoInput');

  private readonly fullNameField = viewChild<FormFieldComponent>('fullNameField');
  private readonly emailField = viewChild<FormFieldComponent>('emailField');
  private readonly phoneField = viewChild<FormFieldComponent>('phoneField');
  private readonly addressField = viewChild<FormFieldComponent>('addressField');

  /** Nom complet saisi, affiché en direct dans la carte d'identité. */
  readonly fullName = computed(() => {
    this.formEvents();
    return this.form.controls.fullName.value;
  });

  /** Photo affichée : aperçu local prioritaire, puis photo enregistrée. */
  readonly displayedPhoto = computed(() => this.photoPreview() ?? this.photoUrl());
  readonly hasPhoto = computed(() => this.displayedPhoto() !== null);

  /** Le bouton n'est actif qu'après une modification valide. */
  readonly canSave = computed(() => {
    this.formEvents();
    return this.form.dirty && this.form.valid && !this.saving();
  });

  /** Messages d'erreur français affichés sous chaque champ. */
  readonly messages = computed<Record<FieldName, string | null>>(() => {
    this.formEvents();

    return {
      fullName: this.messageFor('fullName'),
      email: this.messageFor('email'),
      phone: this.messageFor('phone'),
      address: this.messageFor('address'),
    };
  });

  constructor() {
    this.formEvents = toSignal(this.form.events, { initialValue: null });
    this.load();
  }

  /** Charge les informations actuelles de l'utilisateur connecté. */
  private load(): void {
    this.loadError.set(false);

    this.userService.getMyProfile().subscribe({
      next: (profile) => {
        this.form.setValue({
          fullName: `${profile.firstName} ${profile.lastName}`.trim(),
          email: profile.email,
          phone: profile.phone ?? '',
          address: profile.address ?? '',
        });
        this.form.markAsPristine();
        this.photoUrl.set(profile.photoUrl);
        this.auth.setCurrentUser(profile);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadErrorMessage.set(
          isApiUnreachable(error)
            ? API_UNREACHABLE_MESSAGE
            : 'Impossible de charger vos informations.'
        );
        this.loadError.set(true);
      },
    });
  }

  /** Réessaie le chargement initial. */
  retry(): void {
    this.loading.set(true);
    this.load();
  }

  /** Retour au profil (la confirmation est gérée par le garde `canDeactivate`). */
  async goBack(): Promise<void> {
    await this.router.navigate(['/profil']);
  }

  /** Enregistre les informations personnelles. */
  save(): void {
    if (!this.canSave()) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: UpdateProfilePayload = {
      fullName: raw.fullName.trim(),
      email: raw.email.trim(),
      phone: raw.phone.trim() || null,
      address: raw.address.trim() || null,
    };

    this.userService.updateMyProfile(payload).subscribe({
      next: (profile) => {
        this.saving.set(false);
        this.form.markAsPristine();
        this.auth.setCurrentUser(profile);
        void this.notifications.success('Informations mises à jour');
        void this.router.navigateByUrl('/profil', { replaceUrl: true });
      },
      error: (error: unknown) => {
        this.saving.set(false);

        // Erreurs de validation renvoyées par le serveur : affichées par champ.
        const details = apiFieldErrors(error);
        if (Object.keys(details).length > 0) {
          this.applyServerErrors(details);
          return;
        }

        void this.notifications.error(
          apiErrorMessage(error, 'La mise à jour du profil a échoué. Veuillez réessayer.')
        );
      },
    });
  }

  /** Ouvre le sélecteur d'image du téléphone (galerie ou appareil photo). */
  onPhotoRequested(): void {
    if (this.photoBusy()) {
      return;
    }
    this.photoInput()?.nativeElement.click();
  }

  /** Traite le fichier choisi : contrôle, compression, aperçu puis envoi. */
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    // Réinitialise pour permettre de resélectionner le même fichier.
    input.value = '';

    if (!file) {
      // Aucun fichier (annulation ou permission refusée) : rien à faire.
      return;
    }

    if (!isSupportedPhoto(file)) {
      void this.notifications.error(
        'Format non pris en charge. Choisissez une image JPG ou PNG.'
      );
      return;
    }

    if (file.size > MAX_PHOTO_FILE_BYTES) {
      void this.notifications.error("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    void this.uploadPhoto(file);
  }

  /** Supprime la photo de profil (l'avatar repasse aux initiales). */
  removePhoto(): void {
    if (this.photoBusy()) {
      return;
    }

    this.photoBusy.set(true);

    this.userService.deletePhoto().subscribe({
      next: (profile) => {
        this.photoBusy.set(false);
        this.photoPreview.set(null);
        this.photoUrl.set(null);
        this.auth.setCurrentUser(profile);
        void this.notifications.success('Photo de profil supprimée.');
      },
      error: (error: unknown) => {
        this.photoBusy.set(false);
        void this.notifications.error(
          apiErrorMessage(error, 'La suppression de la photo a échoué. Réessayez.')
        );
      },
    });
  }

  /** Confirmation si l'utilisateur quitte l'écran avec des modifications non enregistrées. */
  async canDeactivate(): Promise<boolean> {
    if (this.form.pristine || this.saving()) {
      return true;
    }

    const alert = await this.alertController.create({
      header: 'Modifications non enregistrées',
      message: 'Voulez-vous vraiment quitter sans enregistrer vos modifications ?',
      buttons: [
        { text: 'Continuer la modification', role: 'cancel' },
        { text: 'Quitter', role: 'confirm' },
      ],
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  /** Compresse puis envoie la photo choisie. */
  private async uploadPhoto(file: File): Promise<void> {
    this.photoBusy.set(true);

    try {
      const processed = await processProfilePhoto(file);

      // Prévisualisation immédiate pendant l'envoi.
      this.photoPreview.set(`data:${processed.mimeType};base64,${processed.data}`);

      this.userService.uploadPhoto(processed.data, processed.mimeType).subscribe({
        next: (profile) => {
          this.photoBusy.set(false);
          this.photoPreview.set(null);
          this.photoUrl.set(profile.photoUrl);
          this.auth.setCurrentUser(profile);
          void this.notifications.success('Photo de profil mise à jour.');
        },
        error: (error: unknown) => {
          this.photoBusy.set(false);
          this.photoPreview.set(null);
          void this.notifications.error(
            apiErrorMessage(error, "L'envoi de la photo a échoué. Réessayez.")
          );
        },
      });
    } catch {
      this.photoBusy.set(false);
      this.photoPreview.set(null);
      void this.notifications.error("Impossible de traiter cette image. Choisissez-en une autre.");
    }
  }

  /** Applique les erreurs de validation renvoyées par l'API (HTTP 422). */
  private applyServerErrors(details: Record<string, string>): void {
    for (const [field, message] of Object.entries(details)) {
      if ((FIELD_ORDER as readonly string[]).includes(field)) {
        const control = this.form.controls[field as FieldName];
        control.setErrors({ server: message });
        control.markAsTouched();
      }
    }

    this.focusFirstInvalid();
  }

  /** Détermine le message d'erreur à afficher pour un champ donné. */
  private messageFor(name: FieldName): string | null {
    const control = this.form.controls[name];

    if (!control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;

    if (typeof errors['server'] === 'string') {
      return errors['server'];
    }

    switch (name) {
      case 'fullName':
        if (errors['required']) {
          return 'Le nom complet est obligatoire.';
        }
        if (errors['nameMin']) {
          return `Le nom complet doit contenir au moins ${MIN_FULL_NAME} caractères.`;
        }
        return `Le nom complet ne doit pas dépasser ${MAX_FULL_NAME} caractères.`;
      case 'email':
        if (errors['required']) {
          return "L'adresse e-mail est obligatoire.";
        }
        if (errors['maxlength']) {
          return `L'adresse e-mail ne doit pas dépasser ${MAX_EMAIL_LENGTH} caractères.`;
        }
        return "Le format de l'adresse e-mail est invalide.";
      case 'phone':
        if (errors['maxlength']) {
          return 'Le numéro de téléphone est trop long.';
        }
        return 'Le format du numéro de téléphone est invalide (ex. +230 5 123 4567).';
      case 'address':
        return `L'adresse ne doit pas dépasser ${MAX_ADDRESS_LENGTH} caractères.`;
    }
  }

  /** Donne le focus au premier champ invalide, dans l'ordre visuel. */
  private focusFirstInvalid(): void {
    const name = FIELD_ORDER.find((field) => this.form.controls[field].invalid);

    switch (name) {
      case 'fullName':
        this.fullNameField()?.focus();
        break;
      case 'email':
        this.emailField()?.focus();
        break;
      case 'phone':
        this.phoneField()?.focus();
        break;
      case 'address':
        this.addressField()?.focus();
        break;
      default:
        break;
    }
  }
}
