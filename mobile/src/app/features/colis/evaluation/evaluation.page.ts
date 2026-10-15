import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTextarea, IonTitle, IonToolbar } from '@ionic/angular';
import { ColisService } from '../../../core/services/colis.service';
import { NotificationService } from '../../../core/services/notification.service';
import { API_UNREACHABLE_MESSAGE, apiErrorMessage, isApiUnreachable } from '../../../shared/models/api-error.model';
import { EVALUATION_COMMENT_MAX, EVALUATION_TAGS, type ColisDetail } from '../../../shared/models/colis.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';
import { TagChipsComponent } from '../../../shared/components/tag-chips/tag-chips.component';

/** Libellés associés à chaque note. */
const RATING_LABELS = ['', 'Décevant', 'Passable', 'Bien', 'Très bien', 'Excellent'];

/** Écran « Évaluer le voyageur ». */
@Component({
  selector: 'app-evaluation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonIcon,
    IonButton,
    IonSpinner,
    IonTextarea,
    AvatarComponent,
    RatingStarsComponent,
    RoundIconButtonComponent,
    TagChipsComponent,
  ],
  templateUrl: './evaluation.page.html',
  styleUrls: ['./evaluation.page.scss'],
})
export class EvaluationPage {
  private readonly colisService = inject(ColisService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  readonly colis = signal<ColisDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly errorMessage = signal('Impossible de charger ce colis.');

  readonly note = signal(0);
  readonly comment = signal('');
  readonly selectedTags = signal<string[]>([]);
  readonly submitting = signal(false);

  readonly tags = EVALUATION_TAGS;
  readonly commentMax = EVALUATION_COMMENT_MAX;

  readonly travelerName = computed(() => this.colis()?.voyageur?.displayName ?? '');

  readonly nameParts = computed(() => {
    const parts = this.travelerName().trim().split(/\s+/).filter(Boolean);
    return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
  });

  readonly firstName = computed(() => this.nameParts().firstName);

  readonly subtitle = computed(
    () =>
      `Votre avis aide la communauté à voyager en confiance avec ${this.firstName()}.`
  );

  readonly commentPlaceholder = computed(
    () => `Partagez votre expérience avec ${this.firstName()}...`
  );

  readonly ratingLabel = computed(() => RATING_LABELS[this.note()] ?? '');

  readonly canSubmit = computed(() => this.note() > 0 && !this.submitting());

  /** Le colis est livré et n'a pas encore été évalué. */
  readonly canEvaluate = computed(() => this.colis()?.peutEvaluer === true);

  ionViewWillEnter(): void {
    this.load();
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/colis', this.id()]);
  }

  setNote(note: number): void {
    this.note.set(note);
  }

  /** Ajoute ou retire une puce. */
  toggleTag(tag: string): void {
    this.selectedTags.update((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  }

  onComment(event: Event): void {
    const detail = (event as CustomEvent<{ value?: string | null }>).detail;
    this.comment.set(detail?.value ?? '');
  }

  /** Publie l'évaluation (les saisies sont conservées en cas d'erreur). */
  submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.submitting.set(true);

    this.colisService
      .evaluate(this.id(), {
        note: this.note(),
        commentaire: this.comment().trim() || null,
        tags: this.selectedTags(),
      })
      .subscribe({
        next: async () => {
          this.submitting.set(false);
          await this.notifications.success('Merci pour votre avis');
          await this.router.navigate(['/colis', this.id()], { replaceUrl: true });
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          void this.notifications.error(
            apiErrorMessage(error, "L'envoi de votre avis a échoué. Réessayez.")
          );
        },
      });
  }

  /** Charge le colis à évaluer. */
  load(): void {
    this.error.set(false);

    this.colisService.getColis(this.id()).subscribe({
      next: (colis) => {
        this.colis.set(colis);

        // Pré-remplit l'évaluation si elle existe déjà.
        if (colis.evaluation) {
          this.note.set(colis.evaluation.note);
          this.comment.set(colis.evaluation.commentaire ?? '');
          this.selectedTags.set(colis.evaluation.tags);
        }

        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          isApiUnreachable(error) ? API_UNREACHABLE_MESSAGE : 'Impossible de charger ce colis.'
        );
        this.error.set(true);
      },
    });
  }
}
