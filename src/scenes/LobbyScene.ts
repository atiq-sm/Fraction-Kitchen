import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONTS } from '../config/constants';
import { MultiplayerClient } from '../multiplayer/MultiplayerClient';
import { playTap } from '../audio/SoundSynth';

export class LobbyScene extends Phaser.Scene {
  private client: MultiplayerClient | null = null;
  private statusText!: Phaser.GameObjects.Text;
  private roomCodeText!: Phaser.GameObjects.Text;
  private playerId: string | null = null;
  private inputCode = '';
  private joinInput!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    const cx = GAME_WIDTH / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.cream, 0.95);
    panel.fillRoundedRect(cx - 300, 80, 600, 520, 20);
    panel.lineStyle(4, COLORS.ink, 0.6);
    panel.strokeRoundedRect(cx - 300, 80, 600, 520, 20);

    this.add
      .text(cx, 120, 'Multiplayer', {
        fontFamily: FONTS.display,
        fontSize: '48px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 170, 'Head-to-Head Fraction Battle!', {
        fontFamily: FONTS.body,
        fontSize: '20px',
        color: '#FF5E5B',
      })
      .setOrigin(0.5);

    // Create Room button
    this.createButton(cx - 140, 230, 'Create Room', COLORS.mint, () => this.handleCreate());

    // Join Room section
    this.createButton(cx + 140, 230, 'Join Room', COLORS.blue, () => this.handleJoin());

    // Code input area
    this.add
      .text(cx, 310, 'Room Code:', {
        fontFamily: FONTS.body,
        fontSize: '18px',
        color: '#3A2E39',
      })
      .setOrigin(0.5);

    const inputBg = this.add.graphics();
    inputBg.fillStyle(COLORS.surface, 1);
    inputBg.fillRoundedRect(cx - 80, 330, 160, 50, 10);
    inputBg.lineStyle(2, COLORS.ink, 0.4);
    inputBg.strokeRoundedRect(cx - 80, 330, 160, 50, 10);

    this.joinInput = this.add
      .text(cx, 355, '____', {
        fontFamily: FONTS.display,
        fontSize: '32px',
        color: '#3A2E39',
        letterSpacing: 8,
      })
      .setOrigin(0.5);

    // Keyboard input for room code
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        this.inputCode = this.inputCode.slice(0, -1);
      } else if (this.inputCode.length < 4 && /^[a-zA-Z0-9]$/.test(event.key)) {
        this.inputCode += event.key.toUpperCase();
      }
      const display = this.inputCode.padEnd(4, '_');
      this.joinInput.setText(display);
    });

    // Status
    this.statusText = this.add
      .text(cx, 420, '', {
        fontFamily: FONTS.body,
        fontSize: '20px',
        color: '#3A2E39',
        align: 'center',
      })
      .setOrigin(0.5);

    this.roomCodeText = this.add
      .text(cx, 460, '', {
        fontFamily: FONTS.display,
        fontSize: '48px',
        color: '#FF5E5B',
      })
      .setOrigin(0.5);

    // Countdown text (hidden)
    this.countdownText = this.add
      .text(cx, 350, '', {
        fontFamily: FONTS.display,
        fontSize: '72px',
        color: '#FFB703',
        stroke: '#3A2E39',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Back button
    this.add
      .text(100, 560, '← Back', {
        fontFamily: FONTS.body,
        fontSize: '22px',
        color: '#3A2E39',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.client) this.client.disconnect();
        this.scene.start('MenuScene');
      });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
  ) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 100, y - 25, 200, 50, 14);
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(x - 96, y - 22, 192, 22, { tl: 12, tr: 12, bl: 0, br: 0 });
    g.lineStyle(3, COLORS.ink, 0.7);
    g.strokeRoundedRect(x - 100, y - 25, 200, 50, 14);

    this.add
      .text(x, y, label, {
        fontFamily: FONTS.display,
        fontSize: '22px',
        color: '#FFFDF7',
        stroke: '#3A2E39',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .zone(x, y, 200, 50)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onClick);
  }

  private async handleCreate() {
    playTap();
    this.statusText.setText('Creating room...');

    try {
      await this.connectClient();
      this.client!.onMessage((msg) => this.handleServerMessage(msg));
      this.client!.createRoom();
    } catch {
      this.statusText.setText('Connection failed. Is the server running?');
    }
  }

  private async handleJoin() {
    if (this.inputCode.length !== 4) {
      this.statusText.setText('Enter a 4-character room code');
      return;
    }
    playTap();
    this.statusText.setText('Joining room...');

    try {
      await this.connectClient();
      this.client!.onMessage((msg) => this.handleServerMessage(msg));
      this.client!.joinRoom(this.inputCode);
    } catch {
      this.statusText.setText('Connection failed. Is the server running?');
    }
  }

  private async connectClient() {
    if (this.client) this.client.disconnect();
    const wsUrl =
      window.location.protocol === 'https:'
        ? `wss://${window.location.hostname}:8080`
        : `ws://localhost:8080`;
    this.client = new MultiplayerClient(wsUrl);
    await this.client.connect();
  }

  private handleServerMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case 'room-created':
        this.playerId = msg.playerId as string;
        this.roomCodeText.setText(msg.roomCode as string);
        this.statusText.setText('Room created! Share this code:');
        break;

      case 'joined':
        this.playerId = msg.playerId as string;
        this.statusText.setText('Joined! Waiting for match to start...');
        break;

      case 'opponent-joined':
        this.statusText.setText('Opponent joined! Starting soon...');
        break;

      case 'match-ready':
        this.statusText.setText('Match starting!');
        this.startCountdown();
        break;

      case 'round-start':
        this.scene.start('GameScene', {
          multiplayer: true,
          client: this.client,
          playerId: this.playerId,
          seed: msg.seed,
          tier: msg.tier,
          round: msg.round,
        });
        break;

      case 'error':
        this.statusText.setText(msg.message as string);
        break;

      case 'disconnected':
        this.statusText.setText('Disconnected from server');
        break;
    }
  }

  private startCountdown() {
    let count = 3;
    this.countdownText.setAlpha(1);
    this.countdownText.setText(String(count));

    const timer = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText.setText(String(count));
          this.tweens.add({
            targets: this.countdownText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
          });
        } else {
          this.countdownText.setText('GO!');
          this.tweens.add({
            targets: this.countdownText,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 500,
          });
        }
      },
    });
  }
}
