export interface SecretAccessor {
  accessSecret(secretName: string, version?: string): Promise<string>;
}

export class SecretManager implements SecretAccessor {
  private client: any;

  constructor(clientInstance?: any) {
    this.client = clientInstance;
  }

  private async getClient(): Promise<any> {
    if (this.client) return this.client;
    const mod = await import("@google-cloud/secret-manager");
    const Client = (mod as any).SecretManagerServiceClient || (mod as any).default;
    this.client = new Client();
    return this.client;
  }

  async accessSecret(secretName: string, version = "latest"): Promise<string> {
    const client = await this.getClient();
    const name = secretName.includes("/versions/") ? secretName : `${secretName}/versions/${version}`;
    const [response] = await client.accessSecretVersion({ name });
    const payload = response?.payload?.data;
    if (!payload) return "";
    if (typeof payload === "string") {
      return Buffer.from(payload, "base64").toString("utf8");
    }
    if (payload instanceof Uint8Array) {
      return Buffer.from(payload).toString("utf8");
    }
    if (Buffer.isBuffer(payload)) {
      return payload.toString("utf8");
    }
    return String(payload);
  }
}

