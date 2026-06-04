import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { ShopScene } from './scenes/ShopScene';
import { MapScene } from './scenes/MapScene';
import { MathBattleScene } from './scenes/MathBattleScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { ResultsScene } from './scenes/ResultsScene';
import { LobbyScene } from './scenes/LobbyScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants';

window.addEventListener('error', (e) => {
  const div = document.createElement('div');
  div.style.cssText =
    'position:fixed;top:0;left:0;right:0;padding:12px;background:#ff0033;color:#fff;font:14px monospace;z-index:9999;white-space:pre-wrap;';
  div.textContent = `[ERROR] ${e.message}\n${e.filename}:${e.lineno}`;
  document.body.appendChild(div);
});

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#FFD8A8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    ShopScene,
    MapScene,
    MathBattleScene,
    GameScene,
    HudScene,
    ResultsScene,
    LobbyScene,
  ],
};

new Phaser.Game(config);
