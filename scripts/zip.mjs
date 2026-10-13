/**
 * Empaqueta `dist/ysystem3-srd.zip` con system.json en la raíz (el campo `download` apunta a ese nombre).
 * Solo archivos del sistema, sin material de desarrollo. Corre después de `npm run build` (necesita packs/).
 */
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const sh = promisify(execFile);
const manifiesto = JSON.parse(await fs.readFile("system.json"));
const CARPETA = `${process.cwd()}/dist/${manifiesto.id}`;
const ZIP = `${CARPETA}.zip`;
const FUERA = ["docs", "node_modules", "tests", "scripts", "_data", "_old", "dist", "package.json", "package-lock.json", ".DS_Store", "*.log", ".git", ".github", ".gitignore"];

if (!(await fs.stat("packs").catch(() => null))) throw new Error("Falta packs/: ejecuta antes `npm run build`.");
await fs.rm(CARPETA, { recursive: true, force: true });
await fs.rm(ZIP, { force: true });
await fs.mkdir(CARPETA, { recursive: true });
await sh("rsync", ["-a", ...FUERA.flatMap(p => ["--exclude", p]), "./", `${CARPETA}/`]);
await sh("zip", ["-r", "-q", "-X", ZIP, "."], { cwd: CARPETA });

const { stdout } = await sh("zipinfo", ["-1", ZIP]);
const archivos = stdout.trim().split("\n");
// Lo imprescindible tiene que ir dentro: sin esto Foundry instala un sistema roto.
for (const f of ["system.json", "module/ysystem3.mjs", "styles/ysystem3.css", "lang/es.json", "templates/hojas/personaje.hbs"]) {
  if (!archivos.includes(f)) throw new Error(`El zip no incluye ${f}`);
}
for (const pack of manifiesto.packs) if (!archivos.some(f => f.startsWith(`${pack.path.replace(/^\.\//, "")}/`))) throw new Error(`El zip no incluye el compendio ${pack.name}`);
const { size } = await fs.stat(ZIP);
await fs.rm(CARPETA, { recursive: true, force: true });
console.log(`${ZIP}: ${archivos.length} archivos, ${(size / 1024 / 1024).toFixed(1)} MB · v${manifiesto.version}`);
