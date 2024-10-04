import { Routes } from '@angular/router';
import { NewGamePageComponent } from './feature/new-game-page.component';
import { NewPlayerPageComponent } from './feature/new-player-page.component';
import { EditPlayerPageComponent } from './feature/edit-player-page.component';
import { ActiveGamePageComponent } from './feature/active-game-page.component';

export const routes: Routes = [
  { path: 'new-game', component: NewGamePageComponent },
  { path: 'new-player', component: NewPlayerPageComponent },
  { path: 'edit-player/:playerId', component: EditPlayerPageComponent },
  { path: 'active-game', component: ActiveGamePageComponent },
  { path: '**', redirectTo: 'new-game' },
];
