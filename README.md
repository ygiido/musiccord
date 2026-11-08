<div align="center">

#  MusicCord

### Apple Music Discord Rich Presence for macOS
**Show what you're listening to on Apple Music in Discord — just like Spotify!**

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey.svg?style=flat-square&logo=apple)](https://apple.com)
[![Discord RPC](https://img.shields.io/badge/Discord-Rich%20Presence-5865F2.svg?style=flat-square&logo=discord)](https://discord.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

[Türkçe](#-türkçe-açıklama) • [English](#-english-description)

---

</div>

## 🇹🇷 Türkçe Açıklama

**MusicCord**, macOS üzerinde Apple Music uygulamasında çalan şarkıyı Discord profilinizde tıpkı Spotify entegrasyonu gibi **"Listening to Apple Music / Apple Music Dinliyor"** durumu olarak anlık gösteren hafif ve kullanışlı bir terminal arayüzüdür.

### ✨ Öne Çıkan Özellikler

- 🎵 **Spotify Benzeri "Dinliyor" Durumu**: Discord profilinizde `Oynuyor` yerine `Listening to Apple Music` başlığı altında şarkıyı ve sanatçıyı sergiler.
- ⏱️ **Canlı İlerleme Çubuğu**: Şarkının o anki süresi ve toplam uzunluğu Discord'da canlı geri sayımla ilerler.
- 🖼️ **HD Albüm Kapağı**: iTunes API üzerinden 600x600 yüksek çözünürlüklü kapak resmini otomatik çeker ve Discord kartında gösterir.
- 🔗 **"Apple Music'te Dinle" Butonu**: Profilinizi görüntüleyen arkadaşlarınız tek tıkla o şarkıyı Apple Music'te açabilir.
- ⏸️ **Akıllı Duraklatma**: Şarkı durdurulduğunda veya kapatıldığında Discord durumu otomatik temizlenir.
- 🖥️ **Mac Açılışında Otomatik Çalışma**: Mac'inizi her açtığınızda arka planda sessizce başlatılacak şekilde tek tuşla ayarlanabilir (LaunchAgent).
- 🎛️ **Kullanıcı Dostu Terminal Menüsü**: Başlatma, durdurma, yeniden başlatma ve otomatik başlama ayarları için numaralı menü.

---

### 🕹️ Terminal Menüsü

Uygulamayı başlattığınızda sizi kullanımı kolay ve anlaşılır bir menü karşılar:

```text
   MusicCord  —  Apple Music Discord Rich Presence
  ═══════════════════════════════════════════════════════
  Arka Plan Servis Durumu: ● Çalışıyor (Arka Planda)
  ───────────────────────────────────────────────────────

  [1] Canlı Modda Başlat
      ↳ Terminalde şarkıyı, süreyi ve ilerleme çubuğunu anlık gösterir.

  [2] Arka Planda Başlat
      ↳ Terminal kapansa bile Discord'da müzik durumu görünmeye devam eder.

  [3] Arka Plandaki Servisi Durdur
      ↳ Çalışan arka plan servisini durdurur ve Discord durumunu kapatır.

  [4] Arka Plan Servisini Yeniden Başlat
      ↳ Bağlantı koparsa veya ayar değiştirdiyseniz servisi tazeler.

  [5] Mac Açıldığında Otomatik Başlatmayı AÇ
      ↳ Bilgisayarınızı her açtığınızda Apple Music RPC kendiliğinden çalışır.

  [6] Mac Açıldığında Otomatik Başlatmayı KAPAT
      ↳ Otomatik başlatmayı sistemden tamamen kaldırır.

  [7] Durumu ve Son Logları İncele
      ↳ Hata var mı veya hangi şarkı çaldı terminalde gösterir.

  ───────────────────────────────────────────────────────
  [0] Çıkış
```

---

### 🚀 Hızlı Kurulum

```bash
# 1. Repoyu klonlayın
git clone https://github.com/ygiido/musiccord.git
cd musiccord

# 2. Bağımlılıkları yükleyin
npm install

# 3. Menüyü başlatın
npm start
```

> **Önemli (İlk Açılış):** macOS, terminalin Music uygulamasını denetlemesi için tek seferlik bir izin penceresi (`"Terminal" Music uygulamasını denetlemek istiyor`) çıkarabilir. Bu uyarıya **"Tamam"** deyin.

---

### ⚙️ Yapılandırma (`config.json`)

Ayarları dilediğiniz gibi özelleştirebilirsiniz:

```json
{
  "clientId": "773825528921849856",
  "checkInterval": 2000,
  "clearOnPause": true,
  "showButton": true,
  "storefrontCountry": "TR"
}
```

---

<br>

## 🇬🇧 English Description

**MusicCord** is a lightweight terminal dashboard and daemon for macOS that displays your currently playing Apple Music track on Discord as a **"Listening to Apple Music"** Rich Presence status — just like the official Spotify integration.

### ✨ Features
- 🎧 **Native-like Listening Status**: Displays as `Listening to Apple Music` with track and artist name.
- ⏱️ **Real-time Elapsed/Remaining Timestamps**: Accurate progress bar inside Discord.
- 🖼️ **High-Res Album Artwork**: Automatically fetches 600x600 cover art via the iTunes API.
- 🔗 **"Listen on Apple Music" Button**: Lets your Discord friends open the playing track with one click.
- ⏸️ **Auto Clear on Pause**: Cleans up status when paused or stopped.
- 🖥️ **Run on Startup (LaunchAgent)**: Option to run silently in the background whenever your Mac boots.
- 🎛️ **Interactive CLI**: Simple numbered menu `[1-7]` to start, stop, restart, or inspect logs.

### 🚀 Getting Started

```bash
git clone https://github.com/ygiido/musiccord.git
cd musiccord
npm install
npm start
```

---

## 📜 Lisans / License

Bu proje [MIT](LICENSE) lisansı altında sunulmaktadır.
