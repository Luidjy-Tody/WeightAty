import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, type FormControl } from '@angular/forms';
import { IonIcon, IonInput } from '@ionic/angular';

/**
 * Champ « mot de passe » réutilisable : masqué par défaut, avec un bouton œil
 * accessible pour l'afficher ou le masquer.
 *
 * Le `FormControl` du formulaire parent est transmis directement au `ion-input`
 * interne : Ionic gère alors lui-même les états `ion-touched` / `ion-invalid`.
 */
@Component({
  selector: 'app-password-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IonInput, IonIcon],
  templateUrl: './password-field.component.html',
  styleUrls: ['./password-field.component.scss'],
})
export class PasswordFieldComponent {
  /** Contrôle du formulaire parent (obligatoire). */
  readonly control = input.required<FormControl<string>>();
  readonly label = input('Mot de passe');
  readonly placeholder = input('');
  readonly autocomplete = input('current-password');
  /** Message d'erreur à afficher sous le champ (null si aucun). */
  readonly errorText = input<string | null>(null);

  readonly visible = signal(false);

  private readonly inputRef = viewChild<IonInput>('nativeInput');

  /** Libellé accessible du bouton œil. */
  toggleLabel(): string {
    return this.visible() ? 'Masquer le mot de passe' : 'Afficher le mot de passe';
  }

  /** Bascule la visibilité du mot de passe. */
  toggle(): void {
    this.visible.update((current) => !current);
  }

  /** Donne le focus au champ (utilisé au passage e-mail → mot de passe). */
  focus(): void {
    void this.inputRef()?.setFocus();
  }
}
