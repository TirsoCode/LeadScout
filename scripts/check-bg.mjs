/**
 * Lee el color de fondo REALMENTE computado por el navegador.
 * Lanza Chromium headless, se conecta por el DevTools Protocol y evalúa
 * getComputedStyle sobre html y body. Así sabremos si el problema es nuestro
 * o es caché / viewer del usuario.
 *
 * Uso: node scripts/check-bg.mjs [url]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const URL_TO_CHECK = process.argv[2] ?? "http://localhost:3000";
const CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome";
const PORT = 9222;

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=/tmp/opencode/chrome-profile",
  "about:blank",
], { stdio: "ignore" });

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* aún arrancando */
    }
    await sleep(250);
  }
  throw new Error("Chromium no arrancó");
}

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
  const wsUrl = await getTarget();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

  await send(ws, "Page.enable");
  await send(ws, "Runtime.enable");
  await send(ws, "Page.navigate", { url: URL_TO_CHECK });
  await sleep(3500); // deja que hydrate y aplique el CSS

  const { result } = await send(ws, "Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const cs = (el) => getComputedStyle(el);
      const html = document.documentElement, body = document.body;
      const sheets = [...document.styleSheets].map(s => {
        try { return { href: s.href, rules: s.cssRules.length }; }
        catch (e) { return { href: s.href, rules: 'BLOQUEADO/CORS' }; }
      });
      return {
        url: location.href,
        title: document.title,
        htmlBg: cs(html).backgroundColor,
        bodyBg: cs(body).backgroundColor,
        bodyColor: cs(body).color,
        bodyHeight: body.getBoundingClientRect().height,
        htmlClass: html.className,
        bodyClass: body.className,
        inlineHtmlStyle: html.getAttribute('style'),
        inlineBodyStyle: body.getAttribute('style'),
        sheetCount: document.styleSheets.length,
        sheets,
        h1: document.querySelector('h1')?.textContent?.trim() ?? null,
        h1Color: document.querySelector('h1') ? cs(document.querySelector('h1')).color : null,
        h1Font: document.querySelector('h1') ? cs(document.querySelector('h1')).fontFamily : null,
        bodyFont: cs(body).fontFamily,
      };
    })()`,
  });

  const info = result.value;
  console.log("=== Lo que ve el navegador ===");
  console.log("url            :", info.url);
  console.log("title          :", info.title);
  console.log("stylesheets    :", info.sheetCount, JSON.stringify(info.sheets));
  console.log("html bg        :", info.htmlBg);
  console.log("body bg        :", info.bodyBg);
  console.log("body color     :", info.bodyColor);
  console.log("body font      :", info.bodyFont);
  console.log("body height    :", info.bodyHeight);
  console.log("h1 texto       :", info.h1);
  console.log("h1 color/font  :", info.h1Color, "/", info.h1Font);
  console.log("html style attr:", info.inlineHtmlStyle);
  console.log("body style attr:", info.inlineBodyStyle);

  const isDark = (c) => {
    const m = c.match(/\d+/g);
    if (!m) return false;
    const [r, g, b] = m.map(Number);
    return (r + g + b) / 3 < 90;
  };
  console.log("");
  console.log("VEREDICTO      :", isDark(info.bodyBg) ? "FONDO OSCURO OK" : "FONDO BLANCO :(");
  ws.close();
} finally {
  chrome.kill("SIGKILL");
}
