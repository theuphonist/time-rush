import { Routes } from '@angular/router';
import { NewGamePageComponent } from './feature/new-game-page/new-game-page.component';

export const routes: Routes = [
  { path: 'new-game', component: NewGamePageComponent },
  { path: '**', component: NewGamePageComponent },
];
