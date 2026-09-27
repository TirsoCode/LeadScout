/**
 * Captura de pantalla con Chromium headless. Sirve para revisar el resultado
 * visual sin depender de un navegador interactivo.
 *
 * Uso: node scripts/shot.mjs <url> <salida.png> [alto]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { writeFileSync } from "node:fs";

const url = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "/tmp/opencode/shot.png";
const height = Number(process.argv[4] ?? 900);
const CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome";
const PORT = 9223;

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=/tmp/opencode/chrome-shot",
  "about:blank",
], { stdio: "ignore" });

let id = 0;
function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const messageId = ++id;
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === messageId) {
        ws.removeEventListener("message", onMessage);
        data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result);
      }
    };
    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
}

try {
  let wsUrl = null;
  for (let i = 0; i < 40 && !wsUrl; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      wsUrl = targets.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? null;
    } catch { /* arrancando */ }
    if (!wsUrl) await sleep(250);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  await send(ws, "Page.enable");
  await send(ws, "Emulation.setDeviceMetricsOverride", {
    width: 1440, height, deviceScaleFactor: 1, mobile: false,
  });
  await send(ws, "Page.navigate", { url });
  await sleep(4000);

  const { data } = await send(ws, "Page.captureScreenshot", { format: "png" });
  writeFileSync(out, Buffer.from(data, "base64"));
  console.log("captura guardada en", out);
  ws.close();
} finally {
  chrome.kill("SIGKILL");
}
