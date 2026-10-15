import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonSpinner } from '@ionic/angular';
import type { DemoAccount, DemoRole } from '../../../../../shared/models/user.model';

/**
 * Accès démonstration : une puce par rôle disponible.
 * La section est entièrement masquée lorsque l'API ne renvoie aucun compte
 * (accès démo désactivé par la configuration serveur).
 */
@Component({
  selector: 'app-demo-access',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonSpinner],
  templateUrl: './demo-access.component.html',
  styleUrls: ['./demo-access.component.scss'],
})
export class DemoAccessComponent {
  readonly accounts = input<DemoAccount[]>([]);
  /** Rôle en cours de connexion (désactive les puces et affiche un indicateur). */
  readonly busyRole = input<DemoRole | null>(null);

  /** Rôle choisi par l'utilisateur. */
  readonly roleSelected = output<DemoRole>();
}
