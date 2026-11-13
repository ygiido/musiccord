import { Client } from "@xhayper/discord-rpc";

export class DiscordPresenceManager {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.lastActivityId = null;
    this.onStatusChange = null;
  }

  async connect() {
    if (this.isConnected || this.isConnecting) return;
    this.isConnecting = true;

    try {
      if (this.client) {
        try {
          await this.client.destroy();
        } catch {}
        this.client = null;
      }

      this.client = new Client({
        clientId: this.config.clientId
      });

      // Hata dinleyicileri (EPIPE vb. çökmeleri önlemek için)
      this.client.on("error", (err) => {
        this.handleDisconnect(err?.message || "Discord RPC error");
      });

      this.client.on("ready", () => {
        this.isConnected = true;
        this.isConnecting = false;
        if (this.onStatusChange) {
          this.onStatusChange({ connected: true, user: this.client.user?.username });
        }
      });

      this.client.on("disconnected", () => {
        this.handleDisconnect("Discord bağlantısı koptu");
      });

      // Login için 5 saniyelik timeout koruması
      const loginPromise = this.client.login();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Discord login timeout (5s)")), 5000)
      );

      await Promise.race([loginPromise, timeoutPromise]);
    } catch (err) {
      this.handleDisconnect(err?.message || "Login başarısız");
    }
  }

  handleDisconnect(errorReason = "") {
    this.isConnected = false;
    this.isConnecting = false;
    this.lastActivityId = null;
    if (this.client) {
      try {
        this.client.destroy();
      } catch {}
      this.client = null;
    }
    if (this.onStatusChange) {
      this.onStatusChange({ connected: false, error: errorReason });
    }
  }

  async setActivity(track, metadata) {
    if (!this.isConnected || !this.client?.user) {
      await this.connect();
      return;
    }

    try {
      const startMs = Date.now() - Math.floor(track.position * 1000);
      const endMs = track.duration > 0 ? startMs + Math.floor(track.duration * 1000) : undefined;
      const displayType = this.config.displayInStatus === "song" ? 2 : 1;

      const activity = {
        name: "Apple Music",
        details: (track.title || "Unknown").substring(0, 127),
        state: (track.artist || "Unknown").substring(0, 127),
        type: 2, // 2: Listening (Spotify gibi)
        statusDisplayType: displayType,
        status_display_type: displayType,
        startTimestamp: startMs,
        endTimestamp: endMs,
        largeImageKey: metadata?.artworkUrl || "applemusic",
        largeImageText: (metadata?.albumName || track.album || track.title).substring(0, 127),
        smallImageKey: "applemusic",
        smallImageText: "Apple Music"
      };

      if (this.config.showButton && metadata?.trackUrl && metadata.trackUrl.startsWith("http")) {
        activity.buttons = [
          {
            label: "Apple Music'te Dinle",
            url: metadata.trackUrl
          }
        ];
      }

      // setActivity için 3 saniyelik timeout koruması (asılı kalmayı engeller)
      const setPromise = this.client.user.setActivity(activity);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("setActivity timeout")), 3000)
      );

      await Promise.race([setPromise, timeoutPromise]);
      this.lastActivityId = track.id;
    } catch (err) {
      this.handleDisconnect(err?.message);
    }
  }

  async clearActivity() {
    if (!this.isConnected || !this.client?.user) return;
    try {
      const clearPromise = this.client.user.clearActivity();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("clearActivity timeout")), 2000)
      );
      await Promise.race([clearPromise, timeoutPromise]);
      this.lastActivityId = null;
    } catch {
      this.handleDisconnect("clearActivity failed");
    }
  }

  async destroy() {
    if (this.client) {
      try {
        await this.clearActivity();
        await this.client.destroy();
      } catch {}
      this.client = null;
      this.isConnected = false;
      this.isConnecting = false;
    }
  }
}
