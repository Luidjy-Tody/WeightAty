import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormControl } from '@angular/forms';
import { IonIcon, IonInput, IonSpinner } from '@ionic/angular';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { TrajetService } from '../../../../core/services/trajet.service';
import type { Airport } from '../../../../shared/models/trajet.model';

/** Délai d'attente avant de lancer la recherche (ms). */
const SEARCH_DEBOUNCE_MS = 250;
/** Délai laissant le temps au clic de sélectionner avant la fermeture (ms). */
const CLOSE_DELAY_MS = 150;

/**
 * Champ d'itinéraire avec autocomplétion d'aéroports / villes.
 * Le contrôle associé contient le **code IATA** sélectionné ; le libellé
 * « Ville (CODE) » n'est qu'un affichage.
 */
@Component({
  selector: 'app-location-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonInput, IonIcon, IonSpinner],
  host: { '[class.field--invalid]': 'errorText() !== null' },
  templateUrl: './location-input.component.html',
  styleUrls: ['./location-input.component.scss'],
})
export class LocationInputComponent {
  private readonly trajetService = inject(TrajetService);

  /** Contrôle du formulaire (contient le code IATA sélectionné). */
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly errorText = input<string | null>(null);
  /** Code IATA à exclure de la liste (départ ≠ destination). */
  readonly excludeIata = input<string | null>(null);
  /** Libellé pré-rempli, pour réutiliser le champ en modification. */
  readonly initialLabel = input('');

  readonly query = signal('');
  readonly results = signal<Airport[]>([]);
  readonly open = signal(false);
  readonly searching = signal(false);

  private readonly searchTerms = new Subject<string>();
  private readonly inputRef = viewChild<IonInput>('nativeInput');

  constructor() {
    const initial = this.initialLabel();
    if (initial) {
      this.query.set(initial);
    }

    this.searchTerms
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((term) => {
          this.searching.set(true);
          return this.trajetService
            .searchAirports(term)
            .pipe(catchError(() => of([] as Airport[])));
        }),
        takeUntilDestroyed()
      )
      .subscribe((items) => {
        this.searching.set(false);
        this.results.set(items);
      });
  }

  /** Saisie utilisateur : la sélection précédente est invalidée. */
  onInput(event: Event): void {
    const detail = (event as CustomEvent<{ value?: string | null }>).detail;
    const value = detail?.value ?? '';

    this.query.set(value);
    this.open.set(true);
    this.control().setValue('');
    this.control().markAsTouched();
    this.searchTerms.next(value);
  }

  /** À l'ouverture, on propose des suggestions même sans saisie. */
  onFocus(): void {
    this.open.set(true);
    this.searchTerms.next(this.query());
  }

  onBlur(): void {
    this.control().markAsTouched();
    setTimeout(() => this.open.set(false), CLOSE_DELAY_MS);
  }

  /** Sélectionne un aéroport (au mousedown, avant la perte du focus). */
  select(airport: Airport): void {
    if (this.isExcluded(airport)) {
      return;
    }

    this.control().setValue(airport.iata);
    this.control().markAsTouched();
    this.query.set(airport.label);
    this.results.set([]);
    this.open.set(false);
  }

  /** Indique si un aéroport doit être désactivé (déjà choisi ailleurs). */
  isExcluded(airport: Airport): boolean {
    return airport.iata === this.excludeIata();
  }

  /** Donne le focus au champ (utilisé après une erreur de validation). */
  focus(): void {
    void this.inputRef()?.setFocus();
  }
}
