import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

// Controla el trafico de las URLs decidiendo que pantalla mostrar segun la ruta escrita.
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login/loginBACK').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./auth/register/registerBACK').then(m => m.RegisterComponent) 
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
    path: 'profile/:username', 
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
    path: 'ajustes', 
    loadComponent: () => import('./ajustes/ajustes').then(m => m.AjustesComponent), 
    canActivate: [authGuard] 
  },
  
  { 
    path: 'privacy', 
    loadComponent: () => import('./privacy/privacy').then(m => m.PrivacyComponent), 
    canActivate: [authGuard] 
  },

  { path: '**', redirectTo: '/login' }
];