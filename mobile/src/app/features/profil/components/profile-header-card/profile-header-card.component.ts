import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonSpinner } from '@ionic/angular';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';

/**
 * Carte d'identité de l'écran « Mes informations » : avatar (photo ou
 * initiales), nom complet mis à jour en direct et actions sur la photo.
 */
@Component({
  selector: 'app-profile-header-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonSpinner, AvatarComponent],
  templateUrl: './profile-header-card.component.html',
  styleUrls: ['./profile-header-card.component.scss'],
})
export class ProfileHeaderCardComponent {
  /** Nom complet saisi dans le formulaire (affiché en direct). */
  readonly fullName = input.required<string>();
  readonly photoUrl = input<string | null>(null);
  readonly hasPhoto = input(false);
  /** Une opération sur la photo est en cours. */
  readonly busy = input(false);

  readonly photoRequested = output<void>();
  readonly photoRemovalRequested = output<void>();

  /** Initiales calculées à partir du nom complet (un seul mot → une lettre). */
  readonly initials = computed(() => {
    const parts = this.fullName().trim().split(/\s+/).filter(Boolean);
    return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
  });
}
