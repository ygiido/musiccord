#!/usr/bin/env node

import { showMenu } from "../src/menu.js";
import * as service from "../src/service.js";

const args = process.argv.slice(2);

if (args.includes("--live") || args.includes("-l")) {
  import("../src/index.js");
} else if (args.includes("--start")) {
  service.install();
  service.start();
  console.log("MusicCord arka plan servisi başlatıldı.");
} else if (args.includes("--stop")) {
  service.stop();
  console.log("MusicCord arka plan servisi durduruldu.");
} else if (args.includes("--restart")) {
  service.restart();
  console.log("MusicCord yeniden başlatıldı.");
} else if (args.includes("--status")) {
  console.log("Durum:", service.isRunning() ? "Çalışıyor" : "Durduruldu");
  console.log("\nSon Loglar:\n", service.getLogs(10));
} else {
  showMenu();
}
