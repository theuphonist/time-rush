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
      @for (player of players(); track player.id) {
      <div class="mb-2">
        <turnt-player-timer
          [turnLength]="gameInfo().turn_length"
          [isActive]="timerStates()[$index]"
          [refreshPeriod]="500"
        ></turnt-player-timer>
        <p-button class="inline-block" (click)="toggleTimer($index)"></p-button>
      </div>
      }
    </div>
  `,
  styles: ``,
})
export class ActiveGamePageComponent {
  private readonly gameService = inject(GameService);
  private readonly playerService = inject(PlayerService);

  readonly gameInfo = this.gameService.gameInfo;
  readonly players = this.playerService.players;

  readonly timerStates: WritableSignal<boolean[]> = signal(
    new Array(this.players().length).fill(false)
  );

  toggleTimer(index: number) {
    this.timerStates.update((timerStates) => {
      const updatedTimerStates = timerStates;
      updatedTimerStates[index] = !updatedTimerStates[index];
      return updatedTimerStates;
    });
  }
}
