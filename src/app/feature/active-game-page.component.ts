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
      [text]="game()?.name ?? 'Time Rush'"
      alwaysSmall
      routeToPreviousPage="/new-game"
    />
    @if (game(); as game) {
    <div class="mt-page-content">
      @if (players(); as players){ @for (player of players; track player.id) {
      <div class="mb-2">
        <time-rush-player-timer
          [turnLength]="game.turnLength"
          [timeUnits]="game.turnLengthUnits"
          [isActive]="activePlayerId() === player.id"
          [player]="player"
        ></time-rush-player-timer>
      </div>
      } }
    </div>
    <p-button
      styleClass="w-full h-8rem mt-6"
      [label]="
        'Tap to start ' +
        (nextPlayer()?.name ?? 'Next Player' | possessiveName) +
        ' turn'
      "
      (click)="changeActivePlayer()"
    />
    } @else {
    <p class="mt-page-content font-italic">
      Game not available. Return to home page to create a new game.
    </p>
    }
  `,
  styles: ``,
})
export class ActiveGamePageComponent {
  // TODO: add skeleton for when data is loading
  private readonly gameService = inject(GameService);
  private readonly playerService = inject(PlayerService);

  readonly game = this.gameService.game;
  readonly players = this.playerService.players;
  readonly activePlayerId = this.playerService.activePlayerId;
  readonly nextPlayer = this.playerService.nextPlayer;

  readonly timerStates: WritableSignal<boolean[]> = signal(
    new Array((this.players() ?? []).length).fill(false)
  );

  changeActivePlayer() {
    this.playerService.changeActivePlayer();
  }
}
