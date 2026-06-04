import Phaser from 'phaser';
import skillData from '../config/skill.json';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.registry.set('skillConfig', skillData);
    this.scene.start('PreloadScene');
  }
}
