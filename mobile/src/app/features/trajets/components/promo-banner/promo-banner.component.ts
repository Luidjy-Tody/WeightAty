import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/** Bannière d'accroche affichée en haut de l'écran de création de trajet. */
@Component({
  selector: 'app-promo-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  templateUrl: './promo-banner.component.html',
  styleUrls: ['./promo-banner.component.scss'],
})
export class PromoBannerComponent {}
