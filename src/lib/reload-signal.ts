let lastTick = 0;

export function bumpReloadTick(): number {
  lastTick = Date.now();
  return lastTick;
}

export function getReloadTick(): number {
  return lastTick;
}