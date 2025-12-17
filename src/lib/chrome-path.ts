import fs from "fs";
import path from "path";

export function resolveBrowserExecutable(): string | null {
  // 1) Hormati ENV kalau ada
  const env = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (env && fs.existsSync(env)) return env;

  const p = process.platform;

  // 2) Cari default path per OS
  if (p === "win32") {
    const candidates: string[] = [];

    const localAppData = process.env.LOCALAPPDATA || "";
    const programFiles = process.env.PROGRAMFILES || "";
    const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "";

    // Chrome
    candidates.push(
      path.join(localAppData, "Google/Chrome/Application/chrome.exe"),
      path.join(programFiles, "Google/Chrome/Application/chrome.exe"),
      path.join(programFilesX86, "Google/Chrome/Application/chrome.exe")
    );
    // Edge (backup)
    candidates.push(
      path.join(localAppData, "Microsoft/Edge/Application/msedge.exe"),
      path.join(programFiles, "Microsoft/Edge/Application/msedge.exe"),
      path.join(programFilesX86, "Microsoft/Edge/Application/msedge.exe")
    );

    for (const c of candidates) {
      if (c && fs.existsSync(c)) return c;
    }
    return null;
  }

  if (p === "darwin") {
    const candidates = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      path.join(
        process.env.HOME || "",
        "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      ),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    return null;
  }

  // linux
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}
