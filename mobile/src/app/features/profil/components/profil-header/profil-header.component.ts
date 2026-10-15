import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import type { ProfileStats, User } from '../../../../shared/models/user.model';
import { getFullName } from '../../../../shared/utils/user-format';

/** En-tête vert foncé de la page profil (avatar, identité, note, badge vérifié). */
@Component({
  selector: 'app-profil-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IonIcon, AvatarComponent],
  templateUrl: './profil-header.component.html',
  styleUrls: ['./profil-header.component.scss'],
})
export class ProfilHeaderComponent {
  readonly user = input.required<User>();
  readonly stats = input.required<ProfileStats>();

  readonly fullName = computed(() => getFullName(this.user().firstName, this.user().lastName));
  readonly noteLabel = computed(() => this.stats().noteMoyenne.toFixed(1));
}
