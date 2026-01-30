import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'feed',
    loadComponent: () => import('./feed/feed').then(m => m.FeedComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'challenges',
    loadComponent: () => import('./challenges/challenges').then(m => m.ChallengesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'post-create',
    loadComponent: () => import('./post-create/post-create').then(m => m.PostCreateComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];