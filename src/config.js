import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, "../config.json");

export const DEFAULT_CONFIG = {
  // Apple Music Discord App ID
  clientId: "773825528921849856",
  // Kontrol aralığı (milisaniye)
  checkInterval: 2000,
  // Duraklatıldığında Discord aktivitesini temizle (Spotify gibi)
  clearOnPause: true,
  // Discord'da 'Apple Music'te Dinle' butonunu göster
  showButton: true,
  // iTunes arama ülkesi (TR veya US)
  storefrontCountry: "TR"
};

export function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      return { ...DEFAULT_CONFIG, ...data };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }
  return { ...DEFAULT_CONFIG };
}

