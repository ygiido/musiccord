import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const APPLESCRIPT = `
tell application "System Events"
    set isRunning to (exists (processes where name is "Music"))
end tell

if not isRunning then
    return "NOT_RUNNING"
end if

tell application "Music"
    try
        set pState to (player state as string)
    on error
        return "NOT_RUNNING"
    end try

    if pState is not "playing" then
        return pState
    end if

    set trackName to ""
    set trackArtist to ""
    set trackAlbum to ""
    set trackDuration to 0
    set playerPos to 0

    try
        set trackName to name of current track
    end try
    try
        set trackArtist to artist of current track
    end try
    try
        set trackAlbum to album of current track
    end try
    try
        set trackDuration to duration of current track
    end try
    try
        set playerPos to player position
    end try

    return "PLAYING###SEP###" & trackName & "###SEP###" & trackArtist & "###SEP###" & trackAlbum & "###SEP###" & playerPos & "###SEP###" & trackDuration
end tell
`;

export async function getMusicState() {
  try {
    // 3 saniyelik timeout koruması
    const { stdout } = await execFileAsync("osascript", ["-e", APPLESCRIPT], { timeout: 3000 });
    const trimmed = stdout.trim();

    if (trimmed === "NOT_RUNNING") {
      return { status: "NOT_RUNNING" };
    }

    if (trimmed === "paused") {
      return { status: "PAUSED" };
    }

    if (trimmed === "stopped") {
      return { status: "STOPPED" };
    }

    if (trimmed.startsWith("PLAYING###SEP###")) {
      const parts = trimmed.split("###SEP###");
      const title = (parts[1] || "").trim();
      const artist = (parts[2] || "").trim();
      const album = (parts[3] || "").trim();
      const position = parseFloat((parts[4] || "0").replace(",", ".")) || 0;
      const duration = parseFloat((parts[5] || "0").replace(",", ".")) || 0;

      return {
        status: "PLAYING",
        title: title || "Bilinmeyen Parça",
        artist: artist || "Bilinmeyen Sanatçı",
        album: album || "",
        position,
        duration,
        id: `${title}:::${artist}:::${album}`
      };
    }

    return { status: "UNKNOWN" };
  } catch (err) {
    return { status: "ERROR", error: err.message };
  }
}
