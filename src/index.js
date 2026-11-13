import { loadConfig } from "./config.js";
import { getMusicState } from "./music.js";
import { fetchTrackMetadata } from "./itunes.js";
import { DiscordPresenceManager } from "./presence.js";
import { TerminalUI } from "./ui.js";

// EPIPE ve beklenmedik IPC hatalarını yakala ve sürecin çökmesini engelle
process.on("uncaughtException", (err) => {
  // EPIPE veya bağlantı hatalarını yut ve güvenle devam et
  if (err?.code === "EPIPE" || err?.message?.includes("EPIPE")) {
    return;
  }
  console.error("MusicCord Hata (Yutuldu):", err?.message || err);
});

process.on("unhandledRejection", (reason) => {
  // Sessizce yut
});

async function main() {
  const config = loadConfig();
  const ui = new TerminalUI();
  const presence = new DiscordPresenceManager(config);

  let currentDiscordStatus = {
    connected: false,
    isConnecting: true,
    user: null
  };

  let currentMusicState = {
    status: "CHECKING"
  };

  let currentTrackMeta = null;
  let isUpdating = false;
  let lastTickTime = Date.now();

  presence.onStatusChange = (status) => {
    currentDiscordStatus = {
      connected: status.connected,
      isConnecting: false,
      user: status.user || null
    };
    ui.render({
      discordStatus: currentDiscordStatus,
      musicState: currentMusicState,
      trackMeta: currentTrackMeta
    });
  };

  // Discord'a ilk bağlantıyı başlat
  presence.connect();

  async function tick() {
    // Watchdog: Eğer isUpdating 8 saniyeden uzun süredir kilitliyse kilidi aç
    if (isUpdating) {
      if (Date.now() - lastTickTime > 8000) {
        isUpdating = false;
      } else {
        return;
      }
    }

    isUpdating = true;
    lastTickTime = Date.now();

    try {
      // 1. Discord bağlantısı kopmuşsa yeniden dene
      if (!presence.isConnected && !presence.isConnecting) {
        presence.connect();
      }

      // 2. Apple Music durumunu kontrol et
      const musicState = await getMusicState();
      currentMusicState = musicState;

      if (musicState.status === "PLAYING") {
        // Metadata çek (önbellekli)
        currentTrackMeta = await fetchTrackMetadata(
          musicState.title,
          musicState.artist,
          musicState.album,
          config.storefrontCountry
        );

        // Discord Presence güncelle
        await presence.setActivity(musicState, currentTrackMeta);
      } else {
        currentTrackMeta = null;
        if (config.clearOnPause) {
          await presence.clearActivity();
        }
      }

      // UI'yi güncelle
      ui.render({
        discordStatus: currentDiscordStatus,
        musicState: currentMusicState,
        trackMeta: currentTrackMeta
      });
    } catch {
      // Beklenmeyen döngü hatalarında devam et
    } finally {
      isUpdating = false;
    }
  }

  // İlk tetikleme
  await tick();

  // Periyodik kontrol
  const timer = setInterval(tick, config.checkInterval);

  // Temiz kapanış (Graceful Shutdown)
  const shutdown = async () => {
    clearInterval(timer);
    ui.clear();
    process.stdout.write("\x1b[?25h"); // Cursor'ı aç
    console.log("MusicCord kapatılıyor...");
    await presence.destroy();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Uygulama hatası:", err);
  process.exit(1);
});
