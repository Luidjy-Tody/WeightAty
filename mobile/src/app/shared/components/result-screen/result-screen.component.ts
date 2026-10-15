import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/**
 * Écran de résultat partagé (Livraison terminée, Rémunération libérée) :
 * grand cercle vert avec icône, halo, points décoratifs, titre et message.
 * Le contenu complémentaire est projeté via `ng-content`.
 */
@Component({
  selector: 'app-result-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    <div class="result">
      <div class="result__visual">
        <span class="result__halo" aria-hidden="true"></span>
        <span class="result__dot result__dot--1" aria-hidden="true"></span>
        <span class="result__dot result__dot--2" aria-hidden="true"></span>
        <span class="result__dot result__dot--3" aria-hidden="true"></span>
        <span class="result__circle">
          <ion-icon [name]="icon()" aria-hidden="true"></ion-icon>
        </span>
      </div>

      <h1 class="result__title">{{ title() }}</h1>
      <p class="result__message">{{ message() }}</p>

      <div class="result__content">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .result {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        max-width: 560px;
        margin: 0 auto;
        padding: 32px 20px calc(28px + env(safe-area-inset-bottom));
        text-align: center;
      }

      .result__visual {
        position: relative;
        display: grid;
        place-items: center;
        width: 168px;
        height: 168px;
        margin-bottom: 8px;
      }

      .result__halo {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: var(--wat-emerald-50);
      }

      .result__circle {
        position: relative;
        display: grid;
        place-items: center;
        width: 104px;
        height: 104px;
        border-radius: 50%;
        background: linear-gradient(150deg, var(--wat-emerald-400), var(--wat-green-800));
        color: #ffffff;
        box-shadow: 0 14px 30px rgba(11, 61, 44, 0.22);
      }

      .result__circle ion-icon {
        font-size: 48px;
      }

      .result__dot {
        position: absolute;
        border-radius: 50%;
        background: var(--wat-emerald-400);
        opacity: 0.6;
      }

      .result__dot--1 {
        top: 14px;
        right: 22px;
        width: 8px;
        height: 8px;
      }

      .result__dot--2 {
        bottom: 26px;
        left: 12px;
        width: 6px;
        height: 6px;
      }

      .result__dot--3 {
        top: 44px;
        left: 6px;
        width: 5px;
        height: 5px;
      }

      .result__title {
        margin: 0;
        color: var(--wat-green-950);
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .result__message {
        margin: 0;
        max-width: 380px;
        color: var(--wat-muted);
        font-size: 15px;
        line-height: 1.5;
      }

      .result__content {
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: 100%;
        margin-top: 18px;
      }
    `,
  ],
})
export class ResultScreenComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
