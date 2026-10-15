import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/** En-tête de marque : logo « avion en papier », nom et slogan. */
@Component({
  selector: 'app-brand-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  templateUrl: './brand-header.component.html',
  styleUrls: ['./brand-header.component.scss'],
})
export class BrandHeaderComponent {}
