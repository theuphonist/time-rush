import { booleanAttribute, Component, computed, input } from '@angular/core';
import { interval, map, of, startWith, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TimeWithColonsPipe } from './time-with-colons.pipe';
import { FontColorClassFromBackgroundPipe } from './font-color-class-from-background.pipe';
import { PlayerModel, TimeUnits } from './custom-types';

@Component({
  selector: 'time-rush-player-timer',
  standalone: true,
  imports: [TimeWithColonsPipe, FontColorClassFromBackgroundPipe],
  template: `
    <div
      class="border-round surface-400 p-1"
      [class.opacity-40]="!isActive()"
      [style.transition]="'width ease-out 0.25s, height ease-out 0.25s'"
      [style.width.%]="
        isActive() ? timerWidthsInPercent.active : timerWidthsInPercent.inactive
      "
      [style.height.rem]="
        isActive() ? timerHeightsInRem.active : timerHeightsInRem.inactive
      "
    >
      <div
        class="relative border-round-sm border-2 h-full w-full"
        [style.border-color]="player().color"
        [style.background-color]="isActive() ? '' : player().color"
      >
        <div
          class="absolute h-full"
          [style.transition]="'width linear ' + refreshPeriod() / 1000 + 's'"
          [style.width.%]="isActive() ? percentRemaining() : 100"
          [style.background-color]="player().color"
        ></div>
        <!-- text-color utility classes aren't working on iOS, use [style] instead -->
        <div
          class="
            absolute flex flex-column w-full h-full align-items-center justify-content-evenly"
          [style]="
            'color: var(--' +
            (player().color | fontColorClassFromBackground) +
            ')'
          "
        >
          <div class="font-semibold opacity-100">
            {{ player().name }}
          </div>
          @if (isActive()){
          <div>
            {{ timeRemaining() ?? turnLengthInMs() | timeWithColons }}
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class PlayerTimerComponent {
  readonly isActive = input(false, { transform: booleanAttribute });
  readonly turnLength = input.required<number>();
  readonly timeUnits = input.required<TimeUnits>();
  readonly refreshPeriod = input<number>(1000);
  readonly player = input.required<PlayerModel>();

  readonly timerWidthsInPercent = { active: 100, inactive: 50 };
  readonly timerHeightsInRem = { active: 4, inactive: 2.5 };

  readonly turnLengthInMs = computed(
    () =>
      this.turnLength() *
      (this.timeUnits() === TimeUnits.Minutes ? 60 : 1) *
      1000
  );

  private readonly isActive$ = toObservable(this.isActive);

  private readonly timeRemaining$ = this.isActive$.pipe(
    switchMap((isActive) =>
      // reset timer when this player deactivates
      // interval() first emits "0" after initial delay, use "startWith" to get initial value immediately
      isActive ? interval(this.refreshPeriod()).pipe(startWith(-1)) : of(-1)
    ),
    map(
      (timerTicks) =>
        this.turnLengthInMs() - (timerTicks + 1) * this.refreshPeriod()
    )
  );

  readonly timeRemaining = toSignal(this.timeRemaining$);
  readonly percentRemaining = computed(
    () =>
      (((this.timeRemaining() ?? this.turnLengthInMs() + this.refreshPeriod()) -
        this.refreshPeriod()) /
        this.turnLengthInMs()) *
      100
  );
}
