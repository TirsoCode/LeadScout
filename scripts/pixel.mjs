/**
 * Lee el color de un píxel de un PNG sin dependencias.
 *
 * Uso: node scripts/pixel.mjs <imagen.png> [x] [y]
 *
 * Solo soporta lo que genera Chromium en --screenshot: PNG de 8 bits, color
 * truecolor (tipo 2) o con alfa (tipo 6), sin entrelazado.
 */
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const [file, xArg, yArg] = process.argv.slice(2);
if (!file) {
  console.error("Uso: node scripts/pixel.mjs <imagen.png> [x] [y]");
  process.exit(1);
}
const targetX = Number(xArg ?? 5);
const targetY = Number(yArg ?? 5);

const buf = readFileSync(file);

// --- recorrido de los chunks del PNG ---
let offset = 8;
let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
const idat = [];

while (offset < buf.length) {
  const length = buf.readUInt32BE(offset);
  const type = buf.toString("ascii", offset + 4, offset + 8);
  const data = buf.subarray(offset + 8, offset + 8 + length);

  if (type === "IHDR") {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data[8];
    colorType = data[9];
    interlace = data[12];
  } else if (type === "IDAT") {
    idat.push(data);
  } else if (type === "IEND") {
    break;
  }
  offset += 12 + length;
}

if (bitDepth !== 8) throw new Error(`bitDepth ${bitDepth} no soportado`);
if (interlace !== 0) throw new Error("PNG entrelazado no soportado");

const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
if (!channels) throw new Error(`colorType ${colorType} no soportado`);

const raw = inflateSync(Buffer.concat(idat));
const stride = width * channels;

// --- deshace los filtros de línea ---
const pixels = Buffer.alloc(height * stride);
let prevRow = Buffer.alloc(stride);

for (let y = 0; y < height; y++) {
  const filter = raw[y * (stride + 1)];
  const row = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
  const out = pixels.subarray(y * stride, (y + 1) * stride);

  for (let i = 0; i < stride; i++) {
    const a = i >= channels ? out[i - channels] : 0;        // pixel a la izquierda
    const b = prevRow[i];                                   // pixel de arriba
    const c = i >= channels ? prevRow[i - channels] : 0;    // diagonal arriba-izq
    const value = row[i];

    switch (filter) {
      case 0: out[i] = value; break;
      case 1: out[i] = (value + a) & 0xff; break;
      case 2: out[i] = (value + b) & 0xff; break;
      case 3: out[i] = (value + ((a + b) >> 1)) & 0xff; break;
      case 4: {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        out[i] = (value + pred) & 0xff;
        break;
      }
      default: throw new Error(`filtro PNG desconocido: ${filter}`);
    }
  }
  prevRow = out;
}

// --- media de una pequeña ventana, para no depender de un píxel suelto ---
const win = 12;
let r = 0, g = 0, b = 0, n = 0;
for (let yy = Math.max(0, targetY); yy < Math.min(height, targetY + win); yy++) {
  for (let xx = Math.max(0, targetX); xx < Math.min(width, targetX + win); xx++) {
    const idx = yy * stride + xx * channels;
    r += pixels[idx];
    g += pixels[idx + 1] !== undefined ? pixels[idx + 1] : 0;
    b += pixels[idx + 2] !== undefined ? pixels[idx + 2] : 0;
    n++;
  }
}
r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);

const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

console.log(`imagen  : ${file} (${width}x${height}, colorType=${colorType})`);
console.log(`píxel   : (${targetX},${targetY}) -> rgb(${r}, ${g}, ${b}) ${hex}`);
console.log(`luma    : ${luma.toFixed(1)} / 255`);
console.log(`veredicto: ${luma < 90 ? "OSCURO (correcto)" : "CLARO / BLANCO"}`);
