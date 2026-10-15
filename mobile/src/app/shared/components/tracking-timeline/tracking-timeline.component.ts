import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import {
  ETAPES_COLIS,
  ETAPE_LABELS,
  type ColisStatut,
  type EtapeColis,
  type EtapeColisItem,
} from '../../models/colis.model';
import { formatExpectedLabel, formatStamp } from '../../utils/datetime';

/** État d'une étape de suivi. */
export type TimelineState = 'done' | 'current' | 'upcoming';

export interface TimelineStep {
  etape: EtapeColis;
  label: string;
  state: TimelineState;
  stamp: string;
}

/**
 * Timeline verticale du suivi d'un colis : étapes terminées (coche verte),
 * étape en cours (anneau vert) et étapes à venir (grisées).
 */
@Component({
  selector: 'app-tracking-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    <ol class="timeline">
      @for (step of steps(); track step.etape) {
        <li [class]="'timeline__step timeline__step--' + step.state">
          <span class="timeline__marker" aria-hidden="true">
            @if (step.state === 'done') {
              <ion-icon name="checkmark"></ion-icon>
            }
          </span>

          <div class="timeline__content">
            <p class="timeline__title">{{ step.label }}</p>
            <p class="timeline__stamp">{{ step.stamp }}</p>
          </div>
        </li>
      }
    </ol>
  `,
  styles: [
    `
      .timeline {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .timeline__step {
        position: relative;
        display: flex;
        gap: 14px;
        padding-bottom: 20px;
      }

      .timeline__step:last-child {
        padding-bottom: 0;
      }

      /* Trait vertical reliant les étapes. */
      .timeline__step:not(:last-child)::before {
        content: '';
        position: absolute;
        top: 26px;
        left: 11px;
        width: 2px;
        height: calc(100% - 22px);
        background: var(--wat-border);
      }

      .timeline__step--done:not(:last-child)::before {
        background: var(--wat-emerald-500);
      }

      .timeline__marker {
        position: relative;
        z-index: 1;
        display: grid;
        flex: 0 0 auto;
        place-items: center;
        width: 24px;
        height: 24px;
        border: 2px solid var(--wat-border);
        border-radius: 50%;
        background: var(--wat-surface);
        color: #ffffff;
      }

      .timeline__step--done .timeline__marker {
        border-color: var(--wat-emerald-500);
        background: var(--wat-emerald-500);
      }

      .timeline__step--done .timeline__marker ion-icon {
        font-size: 14px;
      }

      .timeline__step--current .timeline__marker {
        border-color: var(--wat-emerald-500);
      }

      .timeline__step--current .timeline__marker::after {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--wat-emerald-500);
      }

      .timeline__content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        padding-top: 1px;
      }

      .timeline__title {
        margin: 0;
        color: var(--wat-ink);
        font-size: 15px;
        font-weight: 700;
      }

      .timeline__step--current .timeline__title {
        color: var(--wat-green-700);
      }

      .timeline__step--upcoming .timeline__title {
        color: var(--wat-muted);
        font-weight: 600;
      }

      .timeline__stamp {
        margin: 0;
        color: var(--wat-muted);
        font-size: 13px;
      }
    `,
  ],
})
export class TrackingTimelineComponent {
  readonly etapes = input.required<EtapeColisItem[]>();
  readonly statut = input.required<ColisStatut>();
  readonly dateArriveePrevue = input<string | null>(null);

  readonly steps = computed<TimelineStep[]>(() => {
    const recorded = new Map(this.etapes().map((etape) => [etape.etape, etape.occurredAt]));
    const lastRecordedIndex = ETAPES_COLIS.reduce(
      (last, etape, index) => (recorded.has(etape) ? index : last),
      -1
    );
    const livre = this.statut() === 'livre';

    return ETAPES_COLIS.map((etape, index) => {
      const occurredAt = recorded.get(etape) ?? null;

      let state: TimelineState = 'upcoming';

      if (occurredAt) {
        // Une fois livré, toutes les étapes sont considérées comme terminées.
        state = !livre && index === lastRecordedIndex ? 'current' : 'done';
      }

      const stamp = occurredAt
        ? formatStamp(occurredAt)
        : etape === 'arrive_destination'
          ? formatExpectedLabel(this.dateArriveePrevue())
          : 'À venir';

      return { etape, label: ETAPE_LABELS[etape], state, stamp };
    });
  });
}
