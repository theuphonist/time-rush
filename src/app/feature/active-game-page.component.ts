import { Component, inject, signal, WritableSignal } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { GameService } from '../data-access/game.service';
import { PlayerService } from '../data-access/player.service';
import { PlayerTimerComponent } from '../shared/player-timer.component';
import { ButtonModule } from 'primeng/button';
import { PossessiveNamePipe } from '../shared/possessive-name.pipe';

@Component({
  selector: 'time-rush-active-game-page',
  standalone: true,
  imports: [
    HeaderComponent,
    PlayerTimerComponent,
    ButtonModule,
    PossessiveNamePipe,
  ],
  template: `
    <time-rush-header
      [text]="gameInfo().name"
      alwaysSmall
      routeToPreviousPage="/new-game"
    />
    <div class="mt-page-content">
      @if (players(); as players){ @for (player of players; track player.id) {
      <div class="mb-2">
        <time-rush-player-timer
          [turnLength]="gameInfo().turnLength"
          [timeUnits]="gameInfo().turnLengthUnits"
          [isActive]="activePlayerId() === player.id"
          [player]="player"
        ></time-rush-player-timer>
      </div>
      } }
    </div>
    <p-button
      styleClass="w-full h-8rem mt-6"
      [label]="
        'Tap to start ' + (nextPlayer().display_name | possessiveName) + ' turn'
      "
      (click)="changeActivePlayer()"
    />
  `,
  styles: ``,
})
export class ActiveGamePageComponent {
  // TODO: add skeleton for when data is loading
  private readonly gameService = inject(GameService);
  private readonly playerService = inject(PlayerService);

  readonly gameInfo = this.gameService.gameInfo;
  readonly players = this.playerService.players;
  readonly activePlayerId = this.playerService.activePlayerId;
  readonly nextPlayer = this.playerService.nextPlayer;

  readonly timerStates: WritableSignal<boolean[]> = signal(
    new Array(this.players().length).fill(false)
  );

  changeActivePlayer() {
    this.playerService.changeActivePlayer();
  }
}
