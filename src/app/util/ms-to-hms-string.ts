import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'msToHmsString',
  standalone: true,
})
export class MsToHmsStringPipe implements PipeTransform {
  transform(timeInMilliseconds: number): string {
    if (timeInMilliseconds < 0) {
      return '0s';
    }

    const totalTimeInSeconds = Math.floor(timeInMilliseconds / 1000);

    const secondsPortion = totalTimeInSeconds % 60;
    const remainingTimeInMinutes = (totalTimeInSeconds - secondsPortion) / 60;
    const minutesPortion = remainingTimeInMinutes % 60;
    const hoursPortion = (remainingTimeInMinutes - minutesPortion) / 60;

    const secondsString = `${secondsPortion}s`;
    const minutesString =
      hoursPortion || minutesPortion ? `${minutesPortion}m ` : '';
    const hoursString = hoursPortion ? `${hoursPortion}h ` : '';

    return `${hoursString}${minutesString}${secondsString}`;
  }
}
