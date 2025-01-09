import { defaultPlayerColors } from './constants';

export function getRandomPlayerColor(): (typeof defaultPlayerColors)[number] {
  const randomIndex = Math.floor(Math.random() * defaultPlayerColors.length);
  return defaultPlayerColors[randomIndex];
}
