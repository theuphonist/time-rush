import { DEFAULT_PLAYER_COLORS, LOCAL_PLAYER_PREFIX } from './constants';
import { Game, GameStatuses } from './game-types';
import { Player } from './player-types';

export function getRandomPlayerColor(): (typeof DEFAULT_PLAYER_COLORS)[number] {
  const randomIndex = Math.floor(Math.random() * DEFAULT_PLAYER_COLORS.length);
  return DEFAULT_PLAYER_COLORS[randomIndex];
}

export function getContrastingColorClass(colorHex: string) {
  const red = Number('0x' + colorHex.slice(1, 3));
  const green = Number('0x' + colorHex.slice(3, 5));
  const blue = Number('0x' + colorHex.slice(5, 7));

  // calculates how "dark" a color is
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.5 ? 'gray-900' : 'gray-0';
}

export function isJoinable(game: Game) {
  return game.status === GameStatuses.Pending;
}

export function isRejoinable(game: Game) {
  return isJoinable(game) || game.status === GameStatuses.Active;
}

export function isLocalPlayerId(playerId: Player['id']) {
  return playerId.startsWith(LOCAL_PLAYER_PREFIX);
}
