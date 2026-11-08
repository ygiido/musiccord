import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, "..");
const PLIST_NAME = "com.musiccord.discordpresence.plist";
const LAUNCH_AGENTS_DIR = path.join(os.homedir(), "Library/LaunchAgents");
const PLIST_PATH = path.join(LAUNCH_AGENTS_DIR, PLIST_NAME);
const LOG_FILE = "/tmp/musiccord.log";
const ERR_LOG_FILE = "/tmp/musiccord.err.log";

function getNodePath() {
  try {
    return execSync("which node", { encoding: "utf-8" }).trim();
  } catch {
    return "/usr/local/bin/node";
  }
}

export function isInstalled() {
  return fs.existsSync(PLIST_PATH);
}

export function isRunning() {
  try {
    const output = execSync("launchctl list", { encoding: "utf-8" });
    return output.includes("com.musiccord.discordpresence");
  } catch {
    return false;
  }
}

export function install() {
  const nodePath = getNodePath();
  const indexJs = path.join(PROJECT_DIR, "src/index.js");

  if (!fs.existsSync(LAUNCH_AGENTS_DIR)) {
    fs.mkdirSync(LAUNCH_AGENTS_DIR, { recursive: true });
  }

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.musiccord.discordpresence</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${indexJs}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${PROJECT_DIR}</string>
    <key>StandardOutPath</key>
    <string>${LOG_FILE}</string>
    <key>StandardErrorPath</key>
    <string>${ERR_LOG_FILE}</string>
</dict>
</plist>
`;

  fs.writeFileSync(PLIST_PATH, plistContent, "utf-8");

  // Önce varsa eskiyi çıkar, sonra yükle
  try {
    execSync(`launchctl unload "${PLIST_PATH}" 2>/dev/null`);
  } catch {}

  execSync(`launchctl load "${PLIST_PATH}"`);
  return true;
}

export function uninstall() {
  if (fs.existsSync(PLIST_PATH)) {
    try {
      execSync(`launchctl unload "${PLIST_PATH}" 2>/dev/null`);
    } catch {}
    fs.unlinkSync(PLIST_PATH);
    return true;
  }
  return false;
}

export function start() {
  if (!isInstalled()) {
    install();
    return true;
  }
  try {
    execSync(`launchctl start com.musiccord.discordpresence`);
    return true;
  } catch {
    execSync(`launchctl load "${PLIST_PATH}"`);
    return true;
  }
}

export function stop() {
  if (!isInstalled()) return false;
  try {
    execSync(`launchctl unload "${PLIST_PATH}" 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

export function restart() {
  stop();
  setTimeout(() => {
    start();
  }, 1000);
  return true;
}

export function getLogs(lines = 15) {
  if (!fs.existsSync(LOG_FILE)) {
    return "Henüz log kaydı bulunmuyor.";
  }
  try {
    return execSync(`tail -n ${lines} "${LOG_FILE}"`, { encoding: "utf-8" });
  } catch {
    return "Loglar okunamadı.";
  }
}
