import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import {
  filter,
  interval,
  map,
  merge,
  of,
  startWith,
  switchMap,
  takeUntil,
  tap,
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
            <div class="flex gap-3">
              <time-rush-player-timer
                class="flex-grow-1"
                [isActive]="player.id === this.activePlayerId()"
                [maxValue]="game.turnLength"
                [currentValue]="this.timerValue() ?? game.turnLength"
                [player]="player"
                [paused]="game.paused"
              />
              @if (allowPauseButton() && player.id === activePlayerId()) {
                <p-button
                  styleClass="h-full"
                  severity="secondary"
                  [outlined]="false"
                  (click)="onPauseButtonClick()"
                  ariaLabel="Pause game"
                >
                  <i
                    [class]="
                      'font-bold text-primary text-2xl pi ' +
                      (game.paused ? 'pi-play' : 'pi-pause')
                    "
                  ></i>
                </p-button>
              }
            </div>
          }
        </div>
        @if (showChangePlayerButton()) {
          <button
            class="p-button absolute left-screen right-screen bottom-screen h-15rem flex justify-content-center font-bold"
            (click)="onChangeActivePlayerButtonClick()"
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

  readonly players = this.state.selectConnectedAndSortedPlayers;
  readonly game = this.state.selectGame;
  readonly playerId = this.state.selectPlayerId;
  readonly activePlayerId = this.state.selectActivePlayerId;
  readonly playerIsHost = this.state.selectPlayerIsHost;
  readonly playerIsActive = this.state.selectPlayerIsActive;
  readonly timerValue = this.state.selectTimerValue;
  readonly activePlayerIsConnected = this.state.selectActivePlayerIsConnected;
  readonly isLocalGame = this.state.selectIsLocalGame;

  readonly activePlayerChanges$ = toObservable(this.activePlayerId);

  readonly paused = computed(() => !!this.game()?.paused);
  readonly paused$ = toObservable(this.paused);
  readonly nextInitialInterval = signal(0);

  readonly timerRestartNotifier$ = merge(
    this.activePlayerChanges$.pipe(map(() => 0)),
    this.paused$.pipe(
      filter((paused) => !paused),
      switchMap(() => of(this.nextInitialInterval())),
    ),
  );

  readonly timeRemaining$ = this.timerRestartNotifier$.pipe(
    withLatestFrom(
      toObservable(this.game).pipe(
        filter((gameOrUndefined) => !!gameOrUndefined),
      ),
    ),
    switchMap(([initialInterval, game]) =>
      interval(TIMER_REFRESH_PERIOD).pipe(
        startWith(-1),
        map((ivl) => ivl + initialInterval + 1),
        tap((adjustedInterval) =>
          this.nextInitialInterval.set(adjustedInterval + 1),
        ),
        map(
          (adjustedInterval) =>
            game.turnLength - adjustedInterval * TIMER_REFRESH_PERIOD,
        ),
        takeUntil(this.paused$.pipe(filter((paused) => paused))),
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
      this.playerIsActive() ||
      (!this.activePlayerIsConnected() && this.playerIsHost()) ||
      this.isLocalGame(),
  );

  readonly allowPauseButton = computed(
    () => this.playerIsHost() || this.isLocalGame(),
  );

  readonly changePlayerButtonText = computed(() => {
    if (this.playerIsActive()) {
      return 'Tap to end turn';
    }

    if (!this.activePlayerId() && this.playerIsHost()) {
      return 'Tap to start game';
    }

    return 'Tap to change players';
  });

  onChangeActivePlayerButtonClick() {
    this.state.dispatch(
      this.state.actions.changeActivePlayerButtonClicked,
      undefined,
    );
  }

  onPauseButtonClick() {
    this.state.dispatch(this.state.actions.pauseButtonClicked, undefined);
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
