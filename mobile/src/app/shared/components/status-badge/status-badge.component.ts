import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { BadgeTone } from '../../utils/status';

/** Badge de statut partagé (liste des trajets, liste des colis, suivi…). */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="'badge badge--' + tone()">{{ label() }}</span>`,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .badge {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .badge--success {
        background: var(--wat-emerald-100);
        color: var(--wat-green-800);
      }

      .badge--neutral {
        background: #f1f5f9;
        color: var(--wat-muted);
      }

      .badge--warning {
        background: #fef3c7;
        color: #92400e;
      }

      .badge--danger {
        background: #fee2e2;
        color: var(--wat-danger);
      }

      .badge--info {
        background: #e0f2fe;
        color: #075985;
      }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<BadgeTone>('neutral');
}
