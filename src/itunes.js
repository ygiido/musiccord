const cache = new Map();

/**
 * iTunes Search API üzerinden şarkının albüm kapağını ve dinleme linkini arar
 */
export async function fetchTrackMetadata(title, artist, album = "", country = "TR") {
  const cacheKey = `${title}:::${artist}:::${album}`.toLowerCase();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Varsayılan boş meta
  const defaultMeta = {
    artworkUrl: "https://music.apple.com/assets/favicon/favicon-180.png",
    trackUrl: null,
    albumName: album
  };

  try {
    // Arama terimi
    const query = `${title} ${artist}`.trim();
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=3&country=${country}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        // En uygun eşleşmeyi bulmaya çalış
        const track = data.results[0];
        let artwork = track.artworkUrl100 || "";
        if (artwork) {
          // 100x100 yerine 600x600 yüksek çözünürlük al
          artwork = artwork.replace("100x100bb.jpg", "600x600bb.jpg");
        }

        const meta = {
          artworkUrl: artwork || defaultMeta.artworkUrl,
          trackUrl: track.trackViewUrl || null,
          albumName: track.collectionName || album
        };

        cache.set(cacheKey, meta);
        return meta;
      }
    }

    // İlk ülkede bulunamazsa US mağazasında dene
    if (country !== "US") {
      return await fetchTrackMetadata(title, artist, album, "US");
    }

    cache.set(cacheKey, defaultMeta);
    return defaultMeta;
  } catch (err) {
    cache.set(cacheKey, defaultMeta);
    return defaultMeta;
  }
}

