import { Routes } from '@angular/router';
import { adminGuard } from './features/admin/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/label-verification/pages/verification/verification.component').then(
        (m) => m.VerificationComponent
      ),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/admin/pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/submissions/:id',
    loadComponent: () =>
      import('./features/admin/pages/submission-detail/submission-detail.component').then(
        (m) => m.SubmissionDetailComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];