import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import {
  fromEvent,
  interval,
  map,
  merge,
  Observable,
  of,
  repeat,
  startWith,
  takeUntil,
} from 'rxjs';
import { StateService } from '../data-access/state.service';
import { HeaderComponent } from '../ui/header.component';
import { PlayerTimerComponent } from '../ui/player-timer.component';

@Component({
  selector: 'time-rush-active-game-page',
  standalone: true,
  imports: [HeaderComponent, PlayerTimerComponent, ButtonModule, AsyncPipe],
  template: `
    <time-rush-header
      [text]="game()?.name ?? 'Game'"
      alwaysSmall
      backButtonIcon="pi-sign-out"
      (backButtonClick)="onBackButtonClick()"
    />
    <main class="mt-page-content">
      <div class="flex flex-column gap-2">
        @for (player of samplePlayers; track player.id) {
          <time-rush-player-timer
            [isActive]="$index === samplePlayerIndex"
            [maxValue]="sampleMax"
            [currentValue]="(sampleTimer$ | async) ?? 0"
            [player]="player"
          />
        }
      </div>
      <button
        class="p-button w-full mt-2 flex justify-content-center"
        #restartButton
      >
        Restart Timer
      </button>
      <button
        class="p-button w-full mt-2 flex justify-content-center"
        (click)="
          this.samplePlayerIndex =
            this.samplePlayerIndex === this.samplePlayers.length - 1
              ? 0
              : this.samplePlayerIndex + 1
        "
        #switchPlayerButton
      >
        Switch Player
      </button>
    </main>
  `,
  styles: ``,
})
export class ActiveGamePageComponent implements AfterViewInit {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly state = inject(StateService);

  @ViewChild('restartButton')
  restartButtonElement!: ElementRef<HTMLButtonElement>;
  @ViewChild('switchPlayerButton')
  switchPlayerButton!: ElementRef<HTMLButtonElement>;

  readonly sampleMax = 20000;
  private restartNotifier: Observable<unknown> = of();

  sampleTimer$: Observable<number> = of();
  samplePlayerIndex = 0;

  readonly samplePlayers = [
    {
      name: 'Josh',
      color: '#FF0000',
      id: '1',
      gameId: 'abc',
      position: 0,
      sessionId: 'xyz',
      createdAt: new Date(),
    },
    {
      name: 'Leo',
      color: '#FF00FF',
      id: '2',
      gameId: 'abc',
      position: 1,
      sessionId: 'xyz',
      createdAt: new Date(),
    },
    {
      name: 'Colin',
      color: '#FFFF00',
      id: '3',
      gameId: 'abc',
      position: 2,
      sessionId: 'xyz',
      createdAt: new Date(),
    },
  ];

  readonly game = this.state.selectGame;

  ngAfterViewInit(): void {
    this.restartNotifier = merge(
      fromEvent(this.restartButtonElement.nativeElement, 'click'),
      fromEvent(this.switchPlayerButton.nativeElement, 'click'),
    );

    this.sampleTimer$ = interval(1000).pipe(
      startWith(-1),
      map((val) => this.sampleMax - 1000 * (val + 1)),
      takeUntil(this.restartNotifier),
      repeat(),
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
