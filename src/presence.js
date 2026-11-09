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
      this.client = new Client({
        clientId: this.config.clientId
      });

      this.client.on("ready", () => {
        this.isConnected = true;
        this.isConnecting = false;
        if (this.onStatusChange) {
          this.onStatusChange({ connected: true, user: this.client.user?.username });
        }
      });

      this.client.on("disconnected", () => {
        this.isConnected = false;
        this.isConnecting = false;
        this.lastActivityId = null;
        if (this.onStatusChange) {
          this.onStatusChange({ connected: false });
        }
      });

      await this.client.login();
    } catch (err) {
      this.isConnected = false;
      this.isConnecting = false;
      this.client = null;
      if (this.onStatusChange) {
        this.onStatusChange({ connected: false, error: err.message });
      }
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

      // Spotify gibi:
      // details: Şarkı adı
      // state: Sanatçı adı (Örn: "Avenged Sevenfold")
      // statusDisplayType: 1 -> Üye listesinde/mini profilde doğrudan SANATÇI ADI görünür!
      // (Eğer config'de displayInStatus: "song" seçilirse 2 olur ve şarkı adı görünür)
      const displayType = this.config.displayInStatus === "song" ? 2 : 1;

      const activity = {
        name: "Apple Music",
        details: track.title.substring(0, 127),
        state: track.artist.substring(0, 127),
        type: 2, // 2: Listening (Spotify entegrasyonuyla birebir aynı)
        statusDisplayType: displayType, // Kütüphanenin camelCase formatı
        status_display_type: displayType, // Ham Discord API formatı
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

      await this.client.user.setActivity(activity);
      this.lastActivityId = track.id;
    } catch (err) {
      this.isConnected = false;
      this.client = null;
      this.lastActivityId = null;
    }
  }

  async clearActivity() {
    if (!this.isConnected || !this.client?.user) return;
    try {
      await this.client.user.clearActivity();
      this.lastActivityId = null;
    } catch {
      // Ignored
    }
  }

  async destroy() {
    if (this.client) {
      try {
        await this.clearActivity();
        await this.client.destroy();
      } catch {
        // Ignored
      }
      this.client = null;
      this.isConnected = false;
    }
  }
}
