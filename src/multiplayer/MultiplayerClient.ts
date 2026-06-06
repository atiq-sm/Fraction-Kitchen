export type MessageHandler = (msg: Record<string, unknown>) => void;

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler[] = [];
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(timeoutMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      // Fail fast instead of hanging if the relay isn't reachable.
      const timer = setTimeout(() => {
        this.ws?.close();
        reject(new Error('WebSocket connection timed out'));
      }, timeoutMs);

      this.ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      this.ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error('WebSocket connection failed'));
      };
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          this.handlers.forEach((h) => h(msg));
        } catch {
          // ignore malformed messages
        }
      };
      this.ws.onclose = () => {
        this.handlers.forEach((h) => h({ type: 'disconnected' }));
      };
    });
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler);
  }

  removeHandler(handler: MessageHandler) {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  send(msg: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  createRoom() {
    this.send({ type: 'create' });
  }

  joinRoom(code: string) {
    this.send({ type: 'join', roomCode: code });
  }

  sendPour(ingredientId: string, denominator: number) {
    this.send({ type: 'pour', ingredientId, denominator });
  }

  sendServe(success: boolean) {
    this.send({ type: 'serve', success });
  }

  sendDump() {
    this.send({ type: 'dump' });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers = [];
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
