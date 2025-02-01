import { Component, inject, signal, WritableSignal } from '@angular/core';
import { HeaderComponent } from '../shared/header.component';
import { GameService } from '../data-access/game.service';
import { PlayerService } from '../data-access/player.service';
import { PlayerTimerComponent } from '../shared/player-timer.component';
import { ButtonModule } from 'primeng/button';
import { PossessiveNamePipe } from '../shared/possessive-name.pipe';
import { Confirmation } from 'primeng/api';
import { Router } from '@angular/router';

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
      [text]="game().name"
      alwaysSmall
      backButtonIcon="pi-sign-out"
      [navigationConfirmation]="navigationConfirmation"
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
  private readonly router = inject(Router);

  readonly game = this.gameService.game;
  readonly players = this.playerService.players;
  readonly player = this.playerService.player;
  readonly activePlayerId = this.playerService.activePlayerId;
  readonly nextPlayer = this.playerService.nextPlayer;

  readonly timerStates: WritableSignal<boolean[]> = signal(
    new Array((this.players() ?? []).length).fill(false)
  );

  readonly navigationConfirmation: Confirmation = {
    message:
      "Leave this game?  If you want to return, you'll need to join as a new player.",
    header: 'Leave Game',
    accept: () => {
      this.playerService.leaveOnlineGame();
      this.router.navigate(['/home']);
    },
    acceptButtonStyleClass: 'bg-red-400 border-none w-4rem ml-2',
    rejectButtonStyleClass: 'p-button-text w-4rem',
    acceptIcon: 'none',
    rejectIcon: 'none',
  };

  changeActivePlayer() {
    this.playerService.changeActivePlayer();
  }
}
