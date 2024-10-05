import { Component, inject, signal, WritableSignal } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { GameService } from '../data-access/game.service';
import { PlayerService } from '../data-access/player.service';
import { PlayerTimerComponent } from '../shared/player-timer.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'turnt-active-game-page',
  standalone: true,
  imports: [HeaderComponent, PlayerTimerComponent, ButtonModule],
  template: `
    <turnt-header
      [text]="gameInfo().game_name"
      alwaysSmall
      routeToPreviousPage="/new-game"
    />
    <div class="mt-page-content">
      @if (players(); as players){ @for (player of players; track player.id) {
      <div class="mb-2">
        <turnt-player-timer
          [turnLength]="gameInfo().turn_length"
          [isActive]="activePlayerId() === player.id"
          [refreshPeriod]="500"
          [player]="player"
        ></turnt-player-timer>
      </div>
      } }
    </div>
    <p-button styleClass="w-full mt-6" (click)="changeActivePlayer()">
      <div class="w-full font-semibold text-center">
        Change Player
      </div></p-button
    >
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

  readonly timerStates: WritableSignal<boolean[]> = signal(
    new Array(this.players().length).fill(false)
  );

  changeActivePlayer() {
    this.playerService.changeActivePlayer();
  }
}
