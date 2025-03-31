import {
  Component,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Confirmation } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { GameService } from '../data-access/game.service';
import { PlayerService } from '../data-access/player.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerTimerComponent } from '../ui/player-timer.component';
import { LOCAL_GAME_ID } from '../util/constants';

@Component({
  selector: 'time-rush-active-game-page',
  standalone: true,
  imports: [HeaderComponent, PlayerTimerComponent, ButtonModule],
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

    @if (showEndTurnButton()) {
    <p-button
      styleClass="w-full h-8rem mt-6"
      [label]="endTurnButtonText()"
      (click)="changeActivePlayer()"
    />} } @else {
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

  readonly showEndTurnButton = computed(
    () =>
      this.gameService.isLocalGame() ||
      !this.activePlayerId() ||
      this.player().id === this.activePlayerId()
  );

  readonly endTurnButtonText = computed(() => {
    if (this.gameService.isLocalGame()) {
      return (
        'Tap to start ' + (this.nextPlayer()?.name ?? 'Next Player') + "'s turn"
      );
    }

    if (!this.activePlayerId()) {
      return 'Tap to start game';
    }

    return 'Tap to end your turn';
  });

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
    if (this.game().id === LOCAL_GAME_ID) {
      this.playerService.changeActiveLocalPlayer();
      return;
    }

    this.playerService.changeActiveOnlinePlayer();
  }
}
