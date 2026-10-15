import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { ReactiveFormsModule, type FormControl } from '@angular/forms';
import { IonInput } from '@ionic/angular';

/**
 * Champ numérique avec unité affichée à droite (kg, devise…).
 * La valeur du contrôle est conservée telle que saisie (chaîne), puis
 * convertie en nombre par le formulaire avant l'envoi.
 */
@Component({
  selector: 'app-number-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IonInput],
  host: { '[class.field--invalid]': 'errorText() !== null' },
  templateUrl: './number-field.component.html',
  styleUrls: ['./number-field.component.scss'],
})
export class NumberFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  /** Unité affichée à droite du champ (ex. « kg », « Rs »). */
  readonly unit = input('');
  readonly inputmode = input('decimal');
  readonly errorText = input<string | null>(null);

  private readonly inputRef = viewChild<IonInput>('nativeInput');

  /** Donne le focus au champ (utilisé après une erreur de validation). */
  focus(): void {
    void this.inputRef()?.setFocus();
  }
}
