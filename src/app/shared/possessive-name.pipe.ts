import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'possessiveName',
  standalone: true,
})
export class PossessiveNamePipe implements PipeTransform {
  transform(name: string): string {
    return `${name}'s`;
  }
}
