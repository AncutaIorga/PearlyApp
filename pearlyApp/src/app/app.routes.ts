import { Routes } from '@angular/router';

import { FeedComponent } from './feed/feed';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { ProfileComponent } from './profile/profile';
import { PostCreateComponent } from './post-create/post-create';

export const routes: Routes = [
  { path: '', redirectTo: 'feed', pathMatch: 'full' },

  { path: 'feed', component: FeedComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'create', component: PostCreateComponent },

  { path: '**', redirectTo: 'feed' }
];
