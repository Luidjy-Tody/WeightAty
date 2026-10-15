import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  type ValidationErrors,
} from '@angular/forms';
import { IonInput, IonTextarea } from '@ionic/angular';
import {
  arrivalAfterDepartureValidator,
  flightNumberValidator,
  isoDateValidator,
  locationsDifferValidator,
  notPastDateValidator,
  positiveNumberValidator,
} from '../../../../shared/validators/trajet.validators';
import {
  CURRENCY_SYMBOL,
  TRAJET_LIMITS,
  type CreateTrajetPayload,
} from '../../../../shared/models/trajet.model';
import { normalizeFlightNumber, toNumber, todayIso } from '../../../../shared/utils/trajet-format';
import { DateFieldComponent } from '../date-field/date-field.component';
import { LocationInputComponent } from '../location-input/location-input.component';
import { NumberFieldComponent } from '../number-field/number-field.component';

/** Ordre visuel des champs, utilisé pour le focus sur la première erreur. */
const FIELD_ORDER = [
  'departIata',
  'arriveeIata',
  'dateDepart',
  'dateArrivee',
  'poidsDisponibleKg',
  'prixParKg',
  'compagnieAerienne',
  'numeroVol',
  'informationsSupplementaires',
] as const;

type FieldName = (typeof FIELD_ORDER)[number];

/**
 * Formulaire de trajet : itinéraire, dates, poids, prix et informations de vol.
 * Réutilisable tel quel pour la modification d'un trajet (l'état initial peut
 * être injecté via `patchValue` par la page appelante).
 */
@Component({
  selector: 'app-trip-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IonInput,
    IonTextarea,
    LocationInputComponent,
    DateFieldComponent,
    NumberFieldComponent,
  ],
  templateUrl: './trip-form.component.html',
  styleUrls: ['./trip-form.component.scss'],
})
export class TripFormComponent {
  /** Envoi en cours (bouton principal désactivé). */
  readonly loading = input(false);
  /** Message d'erreur global renvoyé par le serveur. */
  readonly serverError = input<string | null>(null);

  /** Données valides, transmises à la page appelante. */
  readonly submitted = output<CreateTrajetPayload>();

  readonly limits = TRAJET_LIMITS;
  readonly currencySymbol = CURRENCY_SYMBOL;
  readonly today = todayIso();

  readonly form = new FormGroup(
    {
      departIata: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      arriveeIata: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      dateDepart: new FormControl('', {
        nonNullable: true,
        validators: [isoDateValidator, notPastDateValidator],
      }),
      dateArrivee: new FormControl('', { nonNullable: true, validators: [isoDateValidator] }),
      poidsDisponibleKg: new FormControl('', {
        nonNullable: true,
        validators: [
          positiveNumberValidator({ max: TRAJET_LIMITS.maxWeightKg, maxDecimals: 2 }),
        ],
      }),
      prixParKg: new FormControl('', {
        nonNullable: true,
        validators: [
          positiveNumberValidator({ max: TRAJET_LIMITS.maxPricePerKg, maxDecimals: 2 }),
        ],
      }),
      compagnieAerienne: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(TRAJET_LIMITS.airlineMaxLength)],
      }),
      numeroVol: new FormControl('', { nonNullable: true, validators: [flightNumberValidator] }),
      informationsSupplementaires: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(TRAJET_LIMITS.notesMaxLength)],
      }),
    },
    { validators: [locationsDifferValidator, arrivalAfterDepartureValidator] }
  );

  /** `true` après une première tentative d'envoi : affiche les erreurs. */
  private readonly showErrors = signal(false);

  private readonly formEvents: Signal<unknown>;

  private readonly departRef = viewChild<LocationInputComponent>('departField');
  private readonly arriveeRef = viewChild<LocationInputComponent>('arriveeField');
  private readonly dateDepartRef = viewChild<DateFieldComponent>('dateDepartField');
  private readonly dateArriveeRef = viewChild<DateFieldComponent>('dateArriveeField');
  private readonly poidsRef = viewChild<NumberFieldComponent>('poidsField');
  private readonly prixRef = viewChild<NumberFieldComponent>('prixField');
  private readonly compagnieRef = viewChild<IonInput>('compagnieInput');
  private readonly numeroVolRef = viewChild<IonInput>('numeroVolInput');
  private readonly notesRef = viewChild<IonTextarea>('notesInput');

  /** Messages d'erreur français, affichés sous chaque champ. */
  readonly messages = computed<Record<FieldName, string | null>>(() => {
    this.formEvents();

    return {
      departIata: this.messageFor('departIata'),
      arriveeIata: this.messageFor('arriveeIata'),
      dateDepart: this.messageFor('dateDepart'),
      dateArrivee: this.messageFor('dateArrivee'),
      poidsDisponibleKg: this.messageFor('poidsDisponibleKg'),
      prixParKg: this.messageFor('prixParKg'),
      compagnieAerienne: this.messageFor('compagnieAerienne'),
      numeroVol: this.messageFor('numeroVol'),
      informationsSupplementaires: this.messageFor('informationsSupplementaires'),
    };
  });

  constructor() {
    this.formEvents = toSignal(this.form.events, { initialValue: null });
  }

  /** Le formulaire a-t-il été modifié ? (confirmation avant de quitter) */
  isDirty(): boolean {
    return this.form.dirty;
  }

  /** Repasse le formulaire à l'état « non modifié » (après enregistrement). */
  markPristine(): void {
    this.showErrors.set(false);
    this.form.markAsPristine();
  }

  /** Valide puis transmet les données du trajet à la page. */
  submit(): void {
    if (this.loading()) {
      return;
    }

    this.showErrors.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.submitted.emit(this.buildPayload());
  }

  /** Met le numéro de vol au bon format à la sortie du champ. */
  normalizeFlight(): void {
    const control = this.form.controls.numeroVol;
    const value = control.value.trim();

    if (value === '') {
      return;
    }

    const normalized = normalizeFlightNumber(value);

    if (normalized !== control.value) {
      control.setValue(normalized);
    }
  }

  /** Affiche les erreurs de validation renvoyées par le serveur. */
  applyServerErrors(details: Record<string, string>): void {
    this.showErrors.set(true);

    for (const [field, message] of Object.entries(details)) {
      if ((FIELD_ORDER as readonly string[]).includes(field)) {
        const control = this.form.controls[field as FieldName];
        control.setErrors({ server: message });
        control.markAsTouched();
      }
    }

    this.focusFirstInvalid();
  }

  /** Construit la charge utile envoyée à l'API. */
  private buildPayload(): CreateTrajetPayload {
    const raw = this.form.getRawValue();

    return {
      departIata: raw.departIata,
      arriveeIata: raw.arriveeIata,
      dateDepart: raw.dateDepart,
      dateArrivee: raw.dateArrivee,
      poidsDisponibleKg: toNumber(raw.poidsDisponibleKg) ?? 0,
      prixParKg: toNumber(raw.prixParKg) ?? 0,
      compagnieAerienne: raw.compagnieAerienne.trim(),
      numeroVol: normalizeFlightNumber(raw.numeroVol),
      informationsSupplementaires: raw.informationsSupplementaires.trim() || null,
    };
  }

  /** Message d'erreur d'un champ, ou null si le champ est valide ou intact. */
  private messageFor(name: FieldName): string | null {
    const control = this.form.controls[name];

    if (!control.touched && !this.showErrors()) {
      return null;
    }

    const groupErrors = this.form.errors ?? {};

    if (name === 'arriveeIata' && groupErrors['sameLocation']) {
      return 'La destination doit être différente du départ.';
    }
    if (name === 'dateArrivee' && groupErrors['arrivalBeforeDeparture']) {
      return "La date d'arrivée doit être postérieure ou égale à la date de départ.";
    }

    const errors = control.errors;

    if (!errors) {
      return null;
    }

    if (typeof errors['server'] === 'string') {
      return errors['server'];
    }

    switch (name) {
      case 'departIata':
        return errors['required']
          ? "L'aéroport de départ est obligatoire."
          : "L'aéroport de départ est invalide.";
      case 'arriveeIata':
        return errors['required']
          ? "L'aéroport de destination est obligatoire."
          : "L'aéroport de destination est invalide.";
      case 'dateDepart':
        if (errors['required']) {
          return 'La date de départ est obligatoire.';
        }
        if (errors['dateFormat']) {
          return 'Le format de la date de départ est invalide.';
        }
        return 'La date de départ ne peut pas être dans le passé.';
      case 'dateArrivee':
        if (errors['required']) {
          return "La date d'arrivée est obligatoire.";
        }
        return "Le format de la date d'arrivée est invalide.";
      case 'poidsDisponibleKg':
        return this.numberMessage(errors, 'Le poids disponible', 'kg');
      case 'prixParKg':
        return this.numberMessage(errors, 'Le prix par kg');
      case 'compagnieAerienne':
        if (errors['required']) {
          return 'La compagnie aérienne est obligatoire.';
        }
        return `La compagnie aérienne ne doit pas dépasser ${TRAJET_LIMITS.airlineMaxLength} caractères.`;
      case 'numeroVol':
        return errors['required']
          ? 'Le numéro de vol est obligatoire.'
          : 'Le format du numéro de vol est invalide (ex. MK 014).';
      case 'informationsSupplementaires':
        return `Les informations supplémentaires ne doivent pas dépasser ${TRAJET_LIMITS.notesMaxLength} caractères.`;
    }
  }

  /** Message d'erreur commun aux champs numériques. */
  private numberMessage(errors: ValidationErrors, label: string, unit = ''): string {
    const suffix = unit ? ` ${unit}` : '';

    if (errors['required']) {
      return `${label} est obligatoire.`;
    }
    if (errors['numberFormat']) {
      return `${label} doit être un nombre.`;
    }
    if (errors['numberPositive']) {
      return `${label} doit être supérieur à 0.`;
    }
    if (errors['numberMax']) {
      return `${label} ne doit pas dépasser ${(errors['numberMax'] as { max: number }).max}${suffix}.`;
    }
    if (errors['numberDecimals']) {
      return `${label} ne doit pas comporter plus de 2 décimales.`;
    }
    return `${label} est invalide.`;
  }

  /** Premier champ en erreur, dans l'ordre visuel du formulaire. */
  private firstInvalidField(): FieldName | null {
    const groupErrors = this.form.errors ?? {};

    if (groupErrors['sameLocation']) {
      return 'arriveeIata';
    }
    if (groupErrors['arrivalBeforeDeparture']) {
      return 'dateArrivee';
    }

    return FIELD_ORDER.find((name) => this.form.controls[name].invalid) ?? null;
  }

  /** Donne le focus au premier champ invalide. */
  private focusFirstInvalid(): void {
    switch (this.firstInvalidField()) {
      case 'departIata':
        this.departRef()?.focus();
        break;
      case 'arriveeIata':
        this.arriveeRef()?.focus();
        break;
      case 'dateDepart':
        this.dateDepartRef()?.focus();
        break;
      case 'dateArrivee':
        this.dateArriveeRef()?.focus();
        break;
      case 'poidsDisponibleKg':
        this.poidsRef()?.focus();
        break;
      case 'prixParKg':
        this.prixRef()?.focus();
        break;
      case 'compagnieAerienne':
        void this.compagnieRef()?.setFocus();
        break;
      case 'numeroVol':
        void this.numeroVolRef()?.setFocus();
        break;
      case 'informationsSupplementaires':
        void this.notesRef()?.setFocus();
        break;
      default:
        break;
    }
  }
}
