// Renk yardımcıları (ANSI escape kodları)
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  // Renkler
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  // Apple Music pembesi / parlak kırmızısı
  appleRed: "\x1b[38;2;250;36;60m",
  applePink: "\x1b[38;2;252;60;105m",
  discordBlurple: "\x1b[38;2;88;101;242m",
  spotifyGreen: "\x1b[38;2;30;215;96m",
  bgApple: "\x1b[48;2;250;36;60m"
};

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function createProgressBar(current, total, length = 28) {
  if (!total || total <= 0) return `${c.gray}[${"─".repeat(length)}]${c.reset}`;
  const ratio = Math.min(Math.max(current / total, 0), 1);
  const filled = Math.round(length * ratio);
  const empty = length - filled;

  const bar = `${c.applePink}${"━".repeat(filled)}${c.white}●${c.gray}${"─".repeat(Math.max(0, empty - 1))}${c.reset}`;
  return `${bar} ${c.white}${formatTime(current)}${c.gray} / ${formatTime(total)}${c.reset}`;
}

export class TerminalUI {
  constructor() {
    this.lastRender = "";
  }

  clear() {
    process.stdout.write("\x1b[2J\x1b[H");
  }

  render({ discordStatus, musicState, trackMeta }) {
    const lines = [];

    // Header / Banner
    lines.push("");
    lines.push(`  ${c.appleRed}${c.bold} Apple Music${c.reset}  ${c.gray}×${c.reset}  ${c.discordBlurple}${c.bold}Discord Rich Presence${c.reset}`);
    lines.push(`  ${c.gray}${"─".repeat(50)}${c.reset}`);

    // Discord Durumu
    let discordBadge = "";
    if (discordStatus.connected) {
      discordBadge = `${c.green}● Bağlı${c.reset} ${c.gray}(${discordStatus.user || "Discord"})${c.reset}`;
    } else if (discordStatus.isConnecting) {
      discordBadge = `${c.yellow}◐ Bağlanıyor...${c.reset}`;
    } else {
      discordBadge = `${c.red}○ Bağlantı Yok${c.reset} ${c.gray}(Discord uygulamasının açık olduğundan emin olun)${c.reset}`;
    }
    lines.push(`  ${c.bold}Discord:${c.reset}  ${discordBadge}`);

    // Müzik Durumu
    let musicBadge = "";
    if (musicState.status === "PLAYING") {
      musicBadge = `${c.spotifyGreen}▶ Çalıyor${c.reset}`;
    } else if (musicState.status === "PAUSED") {
      musicBadge = `${c.yellow}❚❚ Duraklatıldı${c.reset}`;
    } else if (musicState.status === "STOPPED") {
      musicBadge = `${c.gray}■ Durduruldu${c.reset}`;
    } else if (musicState.status === "NOT_RUNNING") {
      musicBadge = `${c.gray}○ Music.app Kapalı${c.reset}`;
    } else {
      musicBadge = `${c.gray}Bekleniyor...${c.reset}`;
    }
    lines.push(`  ${c.bold}Durum:${c.reset}    ${musicBadge}`);
    lines.push(`  ${c.gray}${"─".repeat(50)}${c.reset}`);

    // Şarkı Kartı
    if (musicState.status === "PLAYING") {
      lines.push("");
      lines.push(`  ${c.applePink}🎵 ${c.bold}${musicState.title}${c.reset}`);
      lines.push(`  ${c.white}👤 ${musicState.artist}${c.reset}`);
      if (musicState.album) {
        lines.push(`  ${c.gray}💿 ${musicState.album}${c.reset}`);
      }
      lines.push("");
      lines.push(`  ${createProgressBar(musicState.position, musicState.duration)}`);

      if (trackMeta?.trackUrl) {
        lines.push("");
        lines.push(`  ${c.cyan}🔗 Apple Music Link:${c.reset} ${c.gray}${trackMeta.trackUrl}${c.reset}`);
      }
    } else if (musicState.status === "PAUSED") {
      lines.push("");
      lines.push(`  ${c.yellow}⏸️  Müzik duraklatıldı.${c.reset}`);
      lines.push(`  ${c.gray}Apple Music'te bir şarkı başlattığınızda otomatik senkronize olur.${c.reset}`);
    } else {
      lines.push("");
      lines.push(`  ${c.gray}Apple Music'te çalan bir parça bekleniyor...${c.reset}`);
      lines.push(`  ${c.dim}Müziği başlattığınızda Discord profilinizde 'Listening to Apple Music' olarak görünecektir.${c.reset}`);
    }

    lines.push("");
    lines.push(`  ${c.gray}${"─".repeat(50)}${c.reset}`);
    lines.push(`  ${c.dim}Çıkış yapmak için ${c.bold}Ctrl+C${c.reset}${c.dim} tuşlarına basın.${c.reset}`);
    lines.push("");

    const output = lines.join("\n");
    if (output !== this.lastRender) {
      this.clear();
      process.stdout.write(output);
      this.lastRender = output;
    }
  }
}

