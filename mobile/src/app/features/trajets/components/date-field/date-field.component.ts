import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { ReactiveFormsModule, type FormControl } from '@angular/forms';
import { IonIcon, IonInput } from '@ionic/angular';

/**
 * Champ de date avec sélecteur natif. La valeur du contrôle est une chaîne
 * au format AAAA-MM-JJ (l'affichage JJ/MM/AAAA est géré par le navigateur).
 */
@Component({
  selector: 'app-date-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IonInput, IonIcon],
  host: { '[class.field--invalid]': 'errorText() !== null' },
  templateUrl: './date-field.component.html',
  styleUrls: ['./date-field.component.scss'],
})
export class DateFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly errorText = input<string | null>(null);
  /** Date minimale sélectionnable (AAAA-MM-JJ). */
  readonly min = input<string | null>(null);

  private readonly inputRef = viewChild<IonInput>('nativeInput');

  /** Donne le focus au champ (utilisé après une erreur de validation). */
  focus(): void {
    void this.inputRef()?.setFocus();
  }
}
