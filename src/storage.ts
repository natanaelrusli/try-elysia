export interface Storage {
  save(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  list(): Promise<string[]>;
}

export class InMemoryStorage implements Storage {
  private storage: Map<string, Buffer> = new Map();

  async save(key: string, data: Buffer): Promise<void> {
    this.storage.set(key, data);
  }

  async get(key: string): Promise<Buffer | null> {
    return this.storage.get(key) || null;
  }

  async list(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}
