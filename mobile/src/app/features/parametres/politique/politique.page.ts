import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { Router } from '@angular/router';
import { RoundIconButtonComponent } from '../../../shared/components/round-icon-button/round-icon-button.component';

/**
 * Sections de la politique de confidentialité.
 * Texte de référence de la plateforme, centralisé ici : il devra être validé
 * (voire complété) par le responsable juridique du projet.
 */
const POLICY_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Données collectées',
    body: "Weight'Aty collecte les informations nécessaires au fonctionnement du service : identité (nom, prénom), coordonnées (e-mail, téléphone, adresse), photo de profil facultative, ainsi que les données liées aux trajets, colis, paiements et évaluations.",
  },
  {
    title: 'Utilisation des données',
    body: "Ces données servent à mettre en relation expéditeurs et voyageurs, à suivre les envois, à sécuriser les paiements et à afficher la réputation des membres. Aucune donnée n'est vendue à des tiers.",
  },
  {
    title: 'Visibilité',
    body: "Vous contrôlez ce que les autres membres voient : nom complet ou abrégé, photo de profil et nombre de voyages. Vos coordonnées (e-mail, téléphone, adresse) ne sont jamais affichées publiquement.",
  },
  {
    title: 'Conservation et suppression',
    body: "Vous pouvez supprimer votre compte depuis l'écran Confidentialité. Votre identité est alors effacée ; les données nécessaires aux transactions et aux évaluations sont conservées de façon anonyme.",
  },
  {
    title: 'Vos droits',
    body: "Vous pouvez consulter et corriger vos informations depuis « Mes informations », et exercer vos droits d'accès, de rectification et d'effacement en contactant l'équipe Weight'Aty.",
  },
];

/** Écran minimal « Politique de confidentialité ». */
@Component({
  selector: 'app-politique',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, RoundIconButtonComponent],
  templateUrl: './politique.page.html',
  styleUrls: ['./politique.page.scss'],
})
export class PolitiquePage {
  private readonly router = inject(Router);

  readonly sections = POLICY_SECTIONS;

  async goBack(): Promise<void> {
    await this.router.navigate(['/parametres/confidentialite']);
  }
}
