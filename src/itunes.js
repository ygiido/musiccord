import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const cache = new Map();

/**
 * Şarkı veya sanatçı adındaki arama sonucunu bozan gereksiz ekleri temizler.
 * Örn: "Hasretin Beni (feat. ...)" -> "Hasretin Beni"
 * "Bohemian Rhapsody - Remastered 2011" -> "Bohemian Rhapsody"
 */
export function sanitizeText(text) {
  if (!text) return "";
  return text
    .replace(/\(feat\..*?\)/gi, "")
    .replace(/\[feat\..*?\]/gi, "")
    .replace(/\(with.*?\)/gi, "")
    .replace(/\[with.*?\]/gi, "")
    .replace(/\(remastered.*?\)/gi, "")
    .replace(/\[remastered.*?\]/gi, "")
    .replace(/\(deluxe.*?\)/gi, "")
    .replace(/\[deluxe.*?\]/gi, "")
    .replace(/\(live.*?\)/gi, "")
    .replace(/\[live.*?\]/gi, "")
    .replace(/\(bonus.*?\)/gi, "")
    .replace(/\[bonus.*?\]/gi, "")
    .replace(/\(official.*?\)/gi, "")
    .replace(/\[official.*?\]/gi, "")
    .replace(/\s-\s(remastered|live|mono|stereo|single|deluxe).*$/gi, "")
    .replace(/\s-\s.*$/g, "") // " - Acoustic" vb.
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // noktalama işaretlerini boşluğa çevir
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * İki metin arasındaki benzerlik skorunu hesaplar (0 - 1 arası)
 */
function calculateSimilarity(str1, str2) {
  const s1 = (str1 || "").toLowerCase().trim();
  const s2 = (str2 || "").toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;

  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.85;
  }

  // Kelime bazlı kesişim
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  let matchCount = 0;
  for (const w of words1) {
    if (words2.has(w)) matchCount++;
  }
  const score = (2 * matchCount) / (words1.size + words2.size);
  return score;
}

/**
 * Apple Music uygulamasından çalan parçanın gömülü orijinal kapağını diske çıkartır
 */
async function extractLocalArtwork() {
  const script = `
tell application "Music"
    try
        set t to current track
        set artCount to count of artworks of t
        if artCount > 0 then
            set artData to data of artwork 1 of t
            set filePath to ((POSIX file "/tmp/musiccord_cover.jpg") as string)
            set outFile to open for access file filePath with write permission
            set eof outFile to 0
            write artData to outFile
            close access outFile
            return "SUCCESS"
        else
            return "NO_ARTWORK"
        end if
    on error err
        try
            close access file filePath
        end try
        return "ERROR: " & err
    end try
end tell
`;

  try {
    const { stdout } = await execFileAsync("osascript", ["-e", script]);
    if (stdout.trim() === "SUCCESS" && fs.existsSync("/tmp/musiccord_cover.jpg")) {
      return "/tmp/musiccord_cover.jpg";
    }
  } catch {}
  return null;
}

/**
 * Yerel kapağı Discord'un erişebileceği geçici hızlı bir CDN'e yükler (Litterbox/Catbox - 72 saatlik geçici barındırma)
 */
async function uploadArtworkToCDN(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("time", "72h"); // 72 saat sonra otomatik silinir
    formData.append("fileToUpload", blob, "artwork.jpg");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith("http")) {
        return url;
      }
    }
  } catch {}
  return null;
}

/**
 * iTunes Search API ile güvenli ve doğrulanmış arama yapar
 */
async function queryITunes(query, country = "TR") {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5&country=${country}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return data.results || [];
    }
  } catch {}
  return [];
}

/**
 * Parça metadata'sını en yüksek doğrulukla bulur
 */
export async function fetchTrackMetadata(title, artist, album = "", country = "TR") {
  const cacheKey = `${title}:::${artist}:::${album}`.toLowerCase();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const cleanTitle = sanitizeText(title);
  const cleanArtist = sanitizeText(artist);

  // 1. Arama stratejileri:
  // Strateji A: Temizlenmiş Başlık + Temizlenmiş Sanatçı
  // Strateji B: Orijinal Başlık + Sanatçı
  const searchQueries = [
    `${cleanTitle} ${cleanArtist}`.trim(),
    `${title} ${artist}`.trim(),
    `${cleanTitle}`.trim()
  ];

  let bestMatch = null;
  let bestScore = 0;

  for (const q of searchQueries) {
    if (!q) continue;

    // Önce TR mağazasında ara, ardından global US mağazasında
    let results = await queryITunes(q, country);
    if (!results.length && country !== "US") {
      results = await queryITunes(q, "US");
    }

    for (const r of results) {
      const titleSim = calculateSimilarity(cleanTitle || title, sanitizeText(r.trackName));
      const artistSim = calculateSimilarity(cleanArtist || artist, sanitizeText(r.artistName));
      // Toplam skor (şarkı adı %60, sanatçı %40 ağırlıklı)
      const totalScore = titleSim * 0.6 + artistSim * 0.4;

      if (totalScore > bestScore && titleSim >= 0.5) {
        bestScore = totalScore;
        bestMatch = r;
      }
    }

    // Yeterince yüksek bir eşleşme bulunduysa diğer sorgulara gerek yok
    if (bestScore >= 0.75) {
      break;
    }
  }

  // Eğer iTunes API güvenilir bir eşleşme bulduysa (> 0.65 eşik değeri)
  if (bestMatch && bestScore >= 0.65) {
    let artwork = bestMatch.artworkUrl100 || "";
    if (artwork) {
      artwork = artwork.replace("100x100bb.jpg", "600x600bb.jpg");
    }

    const meta = {
      artworkUrl: artwork,
      trackUrl: bestMatch.trackViewUrl || null,
      albumName: bestMatch.collectionName || album
    };

    cache.set(cacheKey, meta);
    return meta;
  }

  // 2. iTunes bulamadıysa veya eşleşme skoru düşükse:
  // Doğrudan Apple Music uygulamasından gömülü orijinal kapağı çıkartıp CDN'e yükle!
  try {
    const localArtPath = await extractLocalArtwork();
    if (localArtPath) {
      const cdnUrl = await uploadArtworkToCDN(localArtPath);
      if (cdnUrl) {
        const meta = {
          artworkUrl: cdnUrl,
          trackUrl: null,
          albumName: album || title
        };
        cache.set(cacheKey, meta);
        return meta;
      }
    }
  } catch {}

  // 3. Fallback: Apple Music resmi
  const fallbackMeta = {
    artworkUrl: "https://music.apple.com/assets/favicon/favicon-180.png",
    trackUrl: null,
    albumName: album || title
  };

  cache.set(cacheKey, fallbackMeta);
  return fallbackMeta;
}
