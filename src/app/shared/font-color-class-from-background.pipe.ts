import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fontColorClassFromBackground',
  standalone: true,
})
export class FontColorClassFromBackgroundPipe implements PipeTransform {
  transform(backgroundColorHex: string): string {
    const red = Number('0x' + backgroundColorHex.slice(1, 3));
    const green = Number('0x' + backgroundColorHex.slice(3, 5));
    const blue = Number('0x' + backgroundColorHex.slice(5, 7));

    // calculates how "dark" a color is
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

    return luminance > 0.5 ? 'gray-900' : 'gray-0';
  }
}
