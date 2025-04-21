import { AsyncPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import {
  filter,
  interval,
  map,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { StateService } from '../data-access/state.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerTimerComponent } from '../ui/player-timer.component';
import { TIMER_REFRESH_PERIOD } from '../util/constants';

@Component({
  selector: 'time-rush-active-game-page',
  standalone: true,
  imports: [
    HeaderComponent,
    PlayerTimerComponent,
    ButtonModule,
    AsyncPipe,
    InputNumberModule,
    FormsModule,
  ],
  template: `
    <time-rush-header
      [text]="game()?.name ?? 'Game'"
      alwaysSmall
      backButtonIcon="pi-sign-out"
      (backButtonClick)="onBackButtonClick()"
    />
    <main class="mt-page-content">
      @if (game(); as game) {
        <div class="flex flex-column gap-2">
          @for (player of players(); track player.id) {
            <time-rush-player-timer
              [isActive]="player.id === this.activePlayerId()"
              [maxValue]="game.turnLength"
              [currentValue]="(timeRemaining$ | async) ?? game.turnLength"
              [player]="player"
            />
          }
        </div>
        @if (showChangePlayerButton()) {
          <button
            class="p-button w-full h-9rem mt-7 flex justify-content-center font-bold"
            (click)="onChangeActivePlayerButtonClick()"
            #switchPlayerButton
          >
            {{ changePlayerButtonText() }}
          </button>
        }
      }
    </main>
  `,
  styles: ``,
})
export class ActiveGamePageComponent {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly state = inject(StateService);

  readonly players = this.state.selectPlayers;
  readonly game = this.state.selectGame;
  readonly playerId = this.state.selectPlayerId;
  readonly activePlayerId = this.state.selectActivePlayerId;
  readonly playerIsHost = this.state.selectPlayerIsHost;
  readonly playerIsActive = this.state.selectPlayerIsActive;

  readonly activePlayerChanges$ = toObservable(this.activePlayerId);

  readonly timeRemaining$ = this.activePlayerChanges$.pipe(
    withLatestFrom(
      toObservable(this.game).pipe(
        filter((gameOrUndefined) => !!gameOrUndefined),
      ),
    ),
    switchMap(([_, game]) =>
      interval(TIMER_REFRESH_PERIOD).pipe(
        startWith(-1),
        map((ivl) => game.turnLength - (ivl + 1) * TIMER_REFRESH_PERIOD),
      ),
    ),
  );

  readonly notifyGameOfTimerValueChanges = this.timeRemaining$
    .pipe(takeUntilDestroyed())
    .subscribe((timerValue) => {
      this.state.dispatch(this.state.actions.timerValueChanged, {
        timerValue,
      });
    });

  readonly showChangePlayerButton = computed(
    () =>
      this.playerIsActive() || (!this.activePlayerId() && this.playerIsHost()),
  );

  readonly changePlayerButtonText = computed(() => {
    if (this.playerIsActive()) {
      return 'Tap to end turn';
    }

    if (!this.activePlayerId() && this.playerIsHost()) {
      return 'Tap to start game';
    }

    return '';
  });

  onChangeActivePlayerButtonClick() {
    this.state.dispatch(
      this.state.actions.changePlayerButtonClicked,
      undefined,
    );
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
