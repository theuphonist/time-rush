import { Routes } from '@angular/router';
import { ActiveGamePageComponent } from './feature/active-game-page.component';
import { DispatchLogPageComponent } from './feature/dispatch-log-page.component';
import { EditPlayerPageComponent } from './feature/edit-player-page.component';
import { GameLobbyPageComponent } from './feature/game-lobby-page.component';
import { HomePageComponent } from './feature/home-page.component';
import { JoinGamePageComponent } from './feature/join-game-page.component';
import { ManageLocalPlayersPageComponent } from './feature/manage-local-players-page.component';
import { NewGamePageComponent } from './feature/new-game-page.component';
import { NewPlayerPageComponent } from './feature/new-player-page.component';

export const routes: Routes = [
  { path: 'home', component: HomePageComponent },
  { path: 'new-game', component: NewGamePageComponent },
  { path: 'join-game', component: JoinGamePageComponent },
  {
    path: 'new-player',
    component: NewPlayerPageComponent,
  },
  {
    path: 'edit-player/:playerId',
    component: EditPlayerPageComponent,
  },
  { path: 'active-game', component: ActiveGamePageComponent },
  { path: 'lobby', component: GameLobbyPageComponent },
  { path: 'manage-players', component: ManageLocalPlayersPageComponent },
  { path: 'log', component: DispatchLogPageComponent },
  { path: '**', redirectTo: 'home' },
];
