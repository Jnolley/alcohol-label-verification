import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/label-verification/pages/verification/verification.component').then(
        (m) => m.VerificationComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];