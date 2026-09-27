/**
 * Prueba de la UI real con Chromium headless: hace clic, rellena y navega.
 * Comprueba el camino que el usuario recorre a mano -> registro -> dashboard.
 *
 * Uso: node scripts/ui-flow.mjs
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME = "/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome";
const PORT = 9224;
const BASE = "http://localhost:3000";

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--user-data-dir=/tmp/opencode/chrome-ui",
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

async function evaluate(ws, expression) {
  const { result, exceptionDetails } = await send(ws, "Runtime.evaluate", {
    returnByValue: true, awaitPromise: true, expression,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.text + " " + (exceptionDetails.exception?.description ?? ""));
  return result.value;
}

let pass = 0, fail = 0;
const ok = (m) => { console.log("  PASS ", m); pass++; };
const bad = (m) => { console.log("  FAIL ", m); fail++; };

try {
  let wsUrl = null;
  for (let i = 0; i < 40 && !wsUrl; i++) {
    try {
      const t = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      wsUrl = t.find((x) => x.type === "page")?.webSocketDebuggerUrl ?? null;
    } catch { /* arrancando */ }
    if (!wsUrl) await sleep(250);
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  await send(ws, "Page.enable");
  await send(ws, "Runtime.enable");

  console.log("== A. Botones de la navbar ==");
  await send(ws, "Page.navigate", { url: BASE });
  await sleep(3500);
  const nav = await evaluate(ws, `[...document.querySelectorAll('header button, nav button')]
    .map(b => b.textContent.trim()).filter(Boolean)`);
  nav.includes("Sign in") ? ok(`navbar tiene "Sign in" (${nav.join(" / ")})`) : bad(`navbar sin Sign in: ${nav}`);
  nav.includes("Sign up") ? ok(`navbar tiene "Sign up"`) : bad("navbar sin Sign up");

  console.log("== B. Validación de URL en el propio input ==");
  await evaluate(ws, `(() => {
    const input = document.querySelector('input[aria-label="URL de tu web"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'esto-no-es-un-dominio');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.closest('form').requestSubmit();
  })()`);
  await sleep(1200);
  const err = await evaluate(ws, `document.querySelector('#url-error')?.textContent?.trim() ?? null`);
  err ? ok(`error visible sin llamar al servidor: "${err}"`) : bad("no se muestra el error de URL inválida");
  const bg = await evaluate(ws, `getComputedStyle(document.body).backgroundColor`);
  bg === "rgb(13, 43, 30)" ? ok("fondo sigue verde oscuro tras el error") : bad(`fondo cambió a ${bg}`);

  console.log("== C. El modal de registro se abre ==");
  await evaluate(ws, `(() => {
    const btn = [...document.querySelectorAll('header button')].find(b => b.textContent.trim() === 'Sign up');
    btn.click();
  })()`);
  await sleep(900);
  const dialog = await evaluate(ws, `(() => {
    const d = document.querySelector('[role="dialog"]');
    return d ? d.textContent.includes('Desbloquea tus leads') : false;
  })()`);
  dialog ? ok("el modal de registro abre correctamente") : bad("el modal no abre");

  console.log("== D. Registro real desde la UI ==");
  const email = `ui-${Date.now()}@leadscout.test`;
  await evaluate(ws, `(() => {
    const setNative = (el, v) => {
      const proto = Object.getPrototypeOf(el);
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const mail = document.querySelector('#auth-email');
    const pass = document.querySelector('#auth-password');
    if (!mail || !pass) throw new Error('el modal no tiene los campos del formulario');
    setNative(mail, '${email}');
    setNative(pass, 'pruebalocal123');
    mail.closest('form').requestSubmit();
  })()`);
  // El dev server compila /dashboard bajo demanda: hay que darle margen.
  let where = { url: "(timeout)", h1: null };
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    where = await evaluate(ws, `({ url: location.pathname, h1: document.querySelector('h1')?.textContent?.trim() ?? null })`);
    if (where.url === "/dashboard") break;
  }
  where.url === "/dashboard"
    ? ok(`registro OK -> ${where.url} (h1: "${where.h1}")`)
    : bad(`no llegó al dashboard: ${where.url} (h1: ${where.h1})`);

  console.log("== E. Cuota visible en el dashboard ==");
  const quota = await evaluate(ws, `[...document.querySelectorAll('span')].map(s => s.textContent).find(t => /^\\d\\/\\d$/.test(t?.trim() ?? '')) ?? null`);
  quota ? ok(`cuota pintada: ${quota}`) : bad("no se ve la cuota");

  console.log("== F. Botón 'Salir' ==");
  const hasLogout = await evaluate(ws, `[...document.querySelectorAll('button')].some(b => b.textContent.includes('Salir'))`);
  hasLogout ? ok("el botón Salir está en el dashboard") : bad("falta el botón Salir");

  console.log(`\n  PASS: ${pass}  FAIL: ${fail}`);
  ws.close();
  process.exitCode = fail === 0 ? 0 : 1;
} catch (err) {
  console.error("error:", err.message);
  process.exitCode = 1;
} finally {
  chrome.kill("SIGKILL");
}
