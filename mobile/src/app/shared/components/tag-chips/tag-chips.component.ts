import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Puces sélectionnables (tags d'une évaluation). */
@Component({
  selector: 'app-tag-chips',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chips">
      @for (tag of tags(); track tag) {
        <button
          type="button"
          class="chip"
          [class.chip--on]="isSelected(tag)"
          [attr.aria-pressed]="isSelected(tag)"
          (click)="tagToggled.emit(tag)"
        >
          {{ tag }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .chip {
        min-height: 44px;
        padding: 10px 16px;
        border: 1px solid var(--wat-border);
        border-radius: 999px;
        background: var(--wat-surface);
        color: var(--wat-muted);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }

      .chip--on {
        border-color: var(--wat-emerald-500);
        background: var(--wat-emerald-50);
        color: var(--wat-green-800);
      }

      .chip:active {
        background: var(--wat-emerald-100);
      }
    `,
  ],
})
export class TagChipsComponent {
  readonly tags = input<string[]>([]);
  readonly selected = input<string[]>([]);
  readonly tagToggled = output<string>();

  isSelected(tag: string): boolean {
    return this.selected().includes(tag);
  }
}
