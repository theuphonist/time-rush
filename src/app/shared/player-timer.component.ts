import { booleanAttribute, Component, input } from '@angular/core';
import { interval, map, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'turnt-player-timer',
  standalone: true,
  imports: [],
  template: `
    <div class="border-round surface-200 h-3rem w-full p-1">
      <progress id="file" [max]="turnLength()" [value]="50">70%</progress>
    </div>
  `,
  styles: ``,
})
export class PlayerTimerComponent {
  readonly isActive = input(false, { transform: booleanAttribute });
  readonly turnLength = input.required<number>();
  readonly refreshPeriod = input<number>(1000);

  private readonly isActive$ = toObservable(this.isActive);

  private readonly timeRemaining$ = this.isActive$.pipe(
    switchMap(() => interval(this.refreshPeriod())),
    map(
      (timerTicks) =>
        (this.turnLength() - timerTicks * this.refreshPeriod()) / 1000
    )
  );

  readonly timeRemaining = toSignal(this.timeRemaining$);
}
