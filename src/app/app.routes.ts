import { Routes } from '@angular/router';
import { NewGamePageComponent } from './feature/new-game-page.component';
import { NewPlayerPageComponent } from './feature/new-player-page.component';
import { EditPlayerPageComponent } from './feature/edit-player-page.component';
import { ActiveGamePageComponent } from './feature/active-game-page.component';
import { HomePageComponent } from './feature/home-page.component';
import { GameLobbyPageComponent } from './feature/game-lobby-page.component';
import { ManagePlayersPageComponent } from './feature/manage-players-page.component';

export const routes: Routes = [
  { path: 'home', component: HomePageComponent },
  { path: 'new-game', component: NewGamePageComponent },
  { path: 'new-player', component: NewPlayerPageComponent },
  { path: 'edit-player/:playerId', component: EditPlayerPageComponent },
  { path: 'active-game', component: ActiveGamePageComponent },
  { path: 'lobby', component: GameLobbyPageComponent },
  { path: 'manage-players', component: ManagePlayersPageComponent },
  { path: '**', redirectTo: 'home' },
];
