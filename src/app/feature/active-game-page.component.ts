import {
  Component,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { StateService } from '../data-access/state.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerTimerComponent } from '../ui/player-timer.component';
import { LOCAL_GAME_ID } from '../util/constants';

@Component({
  selector: 'time-rush-active-game-page',
  standalone: true,
  imports: [HeaderComponent, PlayerTimerComponent, ButtonModule],
  template: `
    <time-rush-header
      [text]="game()?.name ?? 'Game'"
      alwaysSmall
      backButtonIcon="pi-sign-out"
      (backButtonClick)="onBackButtonClick()"
    />
    @if (game(); as game) {
      <div class="mt-page-content">
        @if (players(); as players) {
          @for (player of players; track player.id) {
            <div class="mb-2">
              <time-rush-player-timer
                [turnLength]="game.turnLength"
                [timeUnits]="game.turnLengthUnits"
                [isActive]="activePlayerId() === player.id"
                [player]="player"
              ></time-rush-player-timer>
            </div>
          }
        }
      </div>

      @if (showEndTurnButton()) {
        <p-button
          styleClass="w-full h-8rem mt-6"
          [label]="endTurnButtonText()"
          (click)="changeActivePlayer()"
        />
      }
    } @else {
      <p class="mt-page-content font-italic">
        Game not available. Return to home page to create a new game.
      </p>
    }
  `,
  styles: ``,
})
export class ActiveGamePageComponent {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly state = inject(StateService);

  readonly game = this.state.selectGame;
  readonly players = this.state.selectPlayers;
  readonly player = this.state.selectPlayer;
  readonly activePlayerId = signal('FIXME');
  readonly nextPlayer = signal({
    id: 'id-FIXME',
    name: 'name-FIXME',
    color: '#FF0000',
    gameId: 'gameId-FIXME',
    position: -1,
    sessionId: 'sessionId-FIXME',
    createdAt: new Date(),
  });

  readonly showEndTurnButton = computed(
    () =>
      this.state.selectIsLocalGame() ||
      !this.activePlayerId() ||
      this.player()?.id === this.activePlayerId(),
  );

  readonly endTurnButtonText = computed(() => {
    if (this.state.selectIsLocalGame()) {
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
    new Array((this.players() ?? []).length).fill(false),
  );

  changeActivePlayer() {
    if (this.game()?.id === LOCAL_GAME_ID) {
      console.log('changing local game active player');
      return;
    }

    console.log('changing online game active player');
  }

  onBackButtonClick() {
    this.confirmationService.confirm({
      header: 'Leave Game',
      message:
        "Leave this game?  If you want to return, you'll need to join as a new player.",
      accept: () => {
        this.state.dispatch(
          this.state.actions.leaveOnlineGameConfirmed,
          undefined,
        );
      },
      acceptButtonStyleClass: 'bg-red-400 border-none w-4rem ml-2',
      rejectButtonStyleClass: 'p-button-text w-4rem',
      acceptIcon: 'none',
      rejectIcon: 'none',
    });
  }
}
