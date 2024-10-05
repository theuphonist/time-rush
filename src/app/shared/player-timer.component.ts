import { booleanAttribute, Component, input } from '@angular/core';
import { interval, map, of, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { PlayerModel } from '../data-access/player.service';

@Component({
  selector: 'turnt-player-timer',
  standalone: true,
  imports: [],
  template: `
    <div class="border-round surface-200 h-3rem w-full p-1">
      <div
        class="border-round-sm border-2 h-full w-full"
        [style.border-color]="player().color"
      >
        @if (isActive()) {
        <div
          class="h-full"
          style="transition: width linear;"
          [style.width.%]="percentRemaining() ?? 100"
          [style.transition-duration.s]="refreshPeriod() / 1000"
          [style.background-color]="player().color"
        ></div>
        } @else {
        <div class="h-full" [style.background-color]="player().color"></div>
        }
      </div>
    </div>
  `,
})
export class PlayerTimerComponent {
  readonly isActive = input(false, { transform: booleanAttribute });
  readonly turnLength = input.required<number>();
  readonly refreshPeriod = input<number>(1000);
  readonly player = input.required<PlayerModel>();

  private readonly isActive$ = toObservable(this.isActive);

  private readonly percentRemaining$ = this.isActive$.pipe(
    switchMap((isActive) =>
      // only count down when this player is active
      isActive ? interval(this.refreshPeriod()) : of(this.turnLength())
    ),
    map(
      (timerTicks) =>
        (1 - (timerTicks * this.refreshPeriod()) / this.turnLength()) * 100
    )
  );

  readonly percentRemaining = toSignal(this.percentRemaining$);
}
