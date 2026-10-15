import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.page').then(m => m.LoginPage),
  },
 {
  path: 'home',
  loadComponent: () =>
    import('./features/home/home.page').then(m => m.HomePage)
},
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
