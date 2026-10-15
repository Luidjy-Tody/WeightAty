import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { ReactiveFormsModule, type FormControl } from '@angular/forms';
import { IonInput } from '@ionic/angular';

/**
 * Champ de formulaire réutilisable : libellé en gras au-dessus, champ blanc
 * arrondi, message d'erreur en français dessous.
 *
 * Le `FormControl` du formulaire parent est transmis au `ion-input` interne.
 * La bordure rouge en erreur est gérée par la classe `field--invalid` posée
 * sur l'hôte (règle globale, cf. `global.scss`).
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IonInput],
  host: { '[class.field--invalid]': 'errorText() !== null' },
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
})
export class FormFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly type = input('text');
  readonly inputmode = input<string | null>(null);
  readonly autocomplete = input<string | null>(null);
  readonly autocapitalize = input<string | null>(null);
  readonly enterkeyhint = input('next');
  /** Message d'erreur à afficher sous le champ (null si aucun). */
  readonly errorText = input<string | null>(null);

  private readonly inputRef = viewChild<IonInput>('nativeInput');

  /** Donne le focus au champ (utilisé après une erreur de validation). */
  focus(): void {
    void this.inputRef()?.setFocus();
  }
}
