import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // // Auth
  // { 
  //   path: 'login', 
  //   loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent) 
  // },
  // { 
  //   path: 'register', 
  //   loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent) 
  // },

  // AuthBACK
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login/loginBACK').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./auth/register/registerBACK').then(m => m.RegisterComponent) 
  },
  
  // App Core
  { 
    path: 'feed', 
    loadComponent: () => import('./feed/feed').then(m => m.FeedComponent), 
    canActivate: [authGuard] 
  },
  
  // PERFIL PROPIO
  { 
    path: 'profile', 
    loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent), 
    canActivate: [authGuard] 
  },
  
  // PERFIL DE OTRO USUARIO (Importante para la prueba)
  { 
    path: 'profile/:username', 
    loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent), 
    canActivate: [authGuard] 
  },

  // Otras secciones
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
  
  // Privacidad (Si la usas como página separada)
  { 
    path: 'privacy', 
    loadComponent: () => import('./privacy/privacy').then(m => m.PrivacyComponent), 
    canActivate: [authGuard] 
  },

  { path: '**', redirectTo: '/login' }
];