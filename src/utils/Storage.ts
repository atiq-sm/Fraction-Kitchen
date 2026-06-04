const PREFIX = 'fk_';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // localStorage unavailable
  }
}

export function saveBestScore(score: number): void {
  const current = loadBestScore();
  if (score > current) {
    safeSet('bestScore', String(score));
  }
}

export function loadBestScore(): number {
  return parseInt(safeGet('bestScore') ?? '0', 10) || 0;
}

export function saveMuteState(muted: boolean): void {
  safeSet('muted', muted ? '1' : '0');
}

export function loadMuteState(): boolean {
  return safeGet('muted') === '1';
}
