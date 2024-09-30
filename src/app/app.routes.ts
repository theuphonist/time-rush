import { Routes } from '@angular/router';
import { NewGamePageComponent } from './feature/new-game-page.component';
import { NewPlayerPageComponent } from './feature/new-player-page.component';

export const routes: Routes = [
  { path: 'new-game', component: NewGamePageComponent },
  { path: 'new-player', component: NewPlayerPageComponent },
  { path: '**', redirectTo: 'new-game' },
];
