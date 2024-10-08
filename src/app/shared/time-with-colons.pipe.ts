import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeWithColons',
  standalone: true,
})
export class TimeWithColonsPipe implements PipeTransform {
  transform(timeInMilliseconds: number): string {
    if (timeInMilliseconds <= 0) {
      return '0:00';
    }

    if (timeInMilliseconds < 60000) {
      return '0:' + this.addLeadingZero(Math.floor(timeInMilliseconds / 1000));
    }

    let timeWithColons = '';
    let timeInSeconds = timeInMilliseconds / 1000;

    while (timeInSeconds >= 60) {
      const currentTimeValue = Math.floor(timeInSeconds / 60);
      const currentTimeValueAsString = this.addLeadingZero(currentTimeValue);

      timeWithColons += currentTimeValueAsString + ':';

      timeInSeconds -= currentTimeValue * 60;
    }

    return timeWithColons + this.addLeadingZero(Math.floor(timeInSeconds));
  }

  addLeadingZero(value: number): string {
    return (value < 10 ? '0' : '') + value;
  }
}
