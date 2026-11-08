import readline from "readline";
import { fork } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import * as service from "./service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.join(__dirname, "index.js");

// ANSI Renkleri
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  appleRed: "\x1b[38;2;250;36;60m",
  discordBlurple: "\x1b[38;2;88;101;242m"
};

function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

function promptQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

export async function showMenu() {
  while (true) {
    clearScreen();

    const isInstalled = service.isInstalled();
    const isRunning = service.isRunning();

    let serviceBadge = `${c.gray}Kurulu Değil${c.reset}`;
    if (isInstalled) {
      serviceBadge = isRunning
        ? `${c.green}● Çalışıyor (Arka Planda)${c.reset}`
        : `${c.yellow}○ Durduruldu${c.reset}`;
    }

    console.log(`
  ${c.appleRed}${c.bold} MusicCord${c.reset}  ${c.gray}—  Apple Music Discord Rich Presence${c.reset}
  ${c.gray}${"═".repeat(55)}${c.reset}
  ${c.bold}Arka Plan Servis Durumu:${c.reset} ${serviceBadge}
  ${c.gray}${"─".repeat(55)}${c.reset}

  ${c.cyan}${c.bold}[1]${c.reset} ${c.white}Canlı Modda Başlat${c.reset}
      ${c.gray}↳ Terminalde şarkıyı, süreyi ve ilerleme çubuğunu anlık gösterir.${c.reset}

  ${c.cyan}${c.bold}[2]${c.reset} ${c.white}Arka Planda Başlat${c.reset}
      ${c.gray}↳ Terminal kapansa bile Discord'da müzik durumu görünmeye devam eder.${c.reset}

  ${c.cyan}${c.bold}[3]${c.reset} ${c.white}Arka Plandaki Servisi Durdur${c.reset}
      ${c.gray}↳ Çalışan arka plan servisini durdurur ve Discord durumunu kapatır.${c.reset}

  ${c.cyan}${c.bold}[4]${c.reset} ${c.white}Arka Plan Servisini Yeniden Başlat${c.reset}
      ${c.gray}↳ Bağlantı koparsa veya ayar değiştirdiyseniz servisi tazeler.${c.reset}

  ${c.cyan}${c.bold}[5]${c.reset} ${c.green}${c.bold}Mac Açıldığında Otomatik Başlatmayı AÇ${c.reset}
      ${c.gray}↳ Bilgisayarınızı her açtığınızda Apple Music RPC kendiliğinden çalışır.${c.reset}

  ${c.cyan}${c.bold}[6]${c.reset} ${c.red}Mac Açıldığında Otomatik Başlatmayı KAPAT${c.reset}
      ${c.gray}↳ Otomatik başlatmayı sistemden tamamen kaldırır.${c.reset}

  ${c.cyan}${c.bold}[7]${c.reset} ${c.white}Durumu ve Son Logları İncele${c.reset}
      ${c.gray}↳ Hata var mı veya hangi şarkı çaldı terminalde gösterir.${c.reset}

  ${c.gray}${"─".repeat(55)}${c.reset}
  ${c.red}${c.bold}[0]${c.reset} ${c.dim}Çıkış${c.reset}
    `);

    const choice = await promptQuestion(`  ${c.bold}👉 İşlem seçin (0-7): ${c.reset}`);

    switch (choice) {
      case "1": {
        // Canlı modda çalıştırma
        clearScreen();
        console.log(`  ${c.green}Canlı gösterge başlatılıyor... (Durdurmak için Ctrl+C)${c.reset}\n`);
        // Eğer arka planda servis çalışıyorsa çakışmaması için uyar
        if (isRunning) {
          console.log(`  ${c.yellow}⚠️  Arka plan servisi zaten çalışıyor. Çakışma olmaması için arka plan durduruluyor...${c.reset}`);
          service.stop();
        }
        await import(INDEX_PATH);
        return; // index.js kendi döngüsüne girer
      }

      case "2": {
        clearScreen();
        console.log(`\n  ${c.cyan}Arka plan servisi başlatılıyor...${c.reset}`);
        service.install();
        service.start();
        console.log(`  ${c.green}✅ Arka plan servisi başlatıldı! Terminali kapatabilirsiniz.${c.reset}\n`);
        await promptQuestion(`  ${c.dim}Menüye dönmek için Enter'a basın...${c.reset}`);
        break;
      }

      case "3": {
        clearScreen();
        console.log(`\n  ${c.yellow}Servis durduruluyor...${c.reset}`);
        service.stop();
        console.log(`  ${c.green}✅ Arka plan servisi durduruldu.${c.reset}\n`);
        await promptQuestion(`  ${c.dim}Menüye dönmek için Enter'a basın...${c.reset}`);
        break;
      }

      case "4": {
        clearScreen();
        console.log(`\n  ${c.cyan}Servis yeniden başlatılıyor...${c.reset}`);
        service.restart();
        console.log(`  ${c.green}✅ Servis başarıyla yeniden başlatıldı!${c.reset}\n`);
        await promptQuestion(`  ${c.dim}Menüye dönmek için Enter'a basın...${c.reset}`);
        break;
      }

      case "5": {
        clearScreen();
        console.log(`\n  ${c.cyan}Mac açılışına kaydediliyor (LaunchAgent)...${c.reset}`);
        service.install();
        console.log(`  ${c.green}✅ Mac her açıldığında MusicCord arka planda otomatik çalışacak!${c.reset}\n`);
        await promptQuestion(`  ${c.dim}Menüye dönmek için Enter'a basın...${c.reset}`);
        break;
      }

      case "6": {
        clearScreen();
        console.log(`\n  ${c.yellow}Otomatik başlatma kaldırılıyor...${c.reset}`);
        service.uninstall();
        console.log(`  ${c.green}✅ Otomatik başlatma kaldırıldı.${c.reset}\n`);
        await promptQuestion(`  ${c.dim}Menüye dönmek için Enter'a basın...${c.reset}`);
        break;
      }

      case "7": {
        clearScreen();
        console.log(`\n  ${c.bold}📋 Servis Durumu:${c.reset} ${service.isRunning() ? `${c.green}Çalışıyor${c.reset}` : `${c.red}Durduruldu${c.reset}`}`);
        console.log(`  ${c.bold}📜 Son Loglar:${c.reset}\n`);
        console.log(service.getLogs(15));
        console.log(`\n  ${c.gray}${"─".repeat(55)}${c.reset}`);
        await promptQuestion(`  ${c.dim}Menüye dönmek için Enter'a basın...${c.reset}`);
        break;
      }

      case "0":
        clearScreen();
        console.log(`\n  ${c.appleRed} MusicCord'dan çıkıldı. İyi dinlemeler!${c.reset}\n`);
        process.exit(0);

      default:
        break;
    }
  }
}
