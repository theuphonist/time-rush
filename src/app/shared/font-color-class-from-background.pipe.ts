import { Pipe, PipeTransform } from '@angular/core';
import { getContrastingColorClass } from './helpers';

@Pipe({
  name: 'fontColorClassFromBackground',
  standalone: true,
})
export class FontColorClassFromBackgroundPipe implements PipeTransform {
  transform(backgroundColorHex: string): string {
    return getContrastingColorClass(backgroundColorHex);
  }
}
