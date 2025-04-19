import { Component, computed, input } from '@angular/core';
import { TIMER_REFRESH_PERIOD } from '../util/constants';
import { FontColorClassFromBackgroundPipe } from '../util/font-color-class-from-background.pipe';
import { Player } from '../util/player-types';
import { TimeWithColonsPipe } from '../util/time-with-colons.pipe';

@Component({
  selector: 'time-rush-player-timer',
  standalone: true,
  imports: [TimeWithColonsPipe, FontColorClassFromBackgroundPipe],
  template: `
    <div
      class="surface-400 relative"
      [class.opacity-40]="!isActive()"
      [style]="outerStyle()"
    >
      <div class="h-full" [style]="timerBarStyle()"></div>
      <div
        class="absolute flex flex-column gap-1 align-items-center justify-content-center left-0 right-0 top-0 bottom-0"
      >
        <p
          [class]="
            'm-0 font-bold text-' +
            (player().color | fontColorClassFromBackground)
          "
        >
          {{ player().name }}
        </p>
        @if (isActive()) {
          <p
            [class]="
              'm-0 text-' + (player().color | fontColorClassFromBackground)
            "
          >
            {{ currentValue() | timeWithColons }}
          </p>
        }
      </div>
    </div>
  `,
})
export class PlayerTimerComponent {
  readonly isActive = input.required<boolean>();
  readonly maxValue = input.required<number>(); // in ms
  readonly currentValue = input.required<number>(); // in ms
  readonly player = input.required<Player>();

  readonly outerStyle = computed(() => ({
    width: this.isActive() ? '100%' : '50%',
    height: this.isActive() ? '4rem' : '2.5rem',
    borderRadius: '8px',
    padding: '4px',
    transition: 'width ease-out 0.25s, height ease-out 0.25s',
  }));

  readonly timerBarStyle = computed(() => ({
    backgroundColor: this.player().color,
    borderRadius: '4px',
    width: `${this.widthPercent() ?? 100}%`,
    transition: this.isActive() ? 'width linear 1s' : undefined,
  }));

  readonly widthPercent = computed(() => {
    // without this adjustment, the timer won't show the desired value until
    // one second after it changes (or whatever the refresh period is) because
    // of the animation.  this adjustment tells the timer to go to its next
    // value instead of trying to display its true current value
    const adjustedCurrentValue = this.currentValue() - TIMER_REFRESH_PERIOD;

    if (!this.isActive() || adjustedCurrentValue > this.maxValue()) {
      return 100;
    }

    return (adjustedCurrentValue / this.maxValue()) * 100;
  });
}
