import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular';

/** Élément de la barre de navigation basse. */
interface NavItem {
  label: string;
  icon: string;
  link: string;
}

/** Barre de navigation basse de l'application. */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IonIcon],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
})
export class BottomNavComponent {
  readonly items: NavItem[] = [
    { label: 'Accueil', icon: 'home-outline', link: '/home' },
    { label: 'Recherches', icon: 'search-outline', link: '/recherche' },
    { label: 'Demandes', icon: 'cube-outline', link: '/demandes' },
    { label: 'Messages', icon: 'chatbubble-ellipses-outline', link: '/messages' },
    { label: 'Profil', icon: 'person-outline', link: '/profil' },
  ];
}
