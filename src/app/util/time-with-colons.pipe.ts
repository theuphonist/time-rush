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

    let totalSeconds = Math.ceil(timeInMilliseconds / 1000);

    if (totalSeconds < 60) {
      return '0:' + addLeadingZero(totalSeconds);
    }

    const displayedSeconds = totalSeconds % 60;
    const totalMinutes = (totalSeconds - displayedSeconds) / 60;

    if (totalMinutes < 60) {
      return totalMinutes + ':' + addLeadingZero(displayedSeconds);
    }

    const displayedMinutes = totalMinutes % 60;
    const displayedHours = (totalMinutes - displayedMinutes) / 60;

    return (
      displayedHours +
      ':' +
      addLeadingZero(displayedMinutes) +
      ':' +
      addLeadingZero(displayedSeconds)
    );
  }
}

function addLeadingZero(value: number): string {
  return (value < 10 ? '0' : '') + value;
}
