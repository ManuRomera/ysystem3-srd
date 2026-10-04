/**
 * Validación estática antes de publicar: sintaxis, JSON, rutas de plantillas y recursos citados,
 * coherencia entre etiqueta y versión, e integridad de los datos de reglas.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const errores = [];
const listar = async dir => (await fs.readdir(dir, { recursive: true })).map(f => path.join(dir, f));
const existe = p => fs.stat(p).then(() => true, () => false);

const manifiesto = JSON.parse(await fs.readFile("system.json"));
const etiqueta = process.env.RELEASE_TAG;
if (etiqueta && etiqueta !== `v${manifiesto.version}`) errores.push(`La etiqueta ${etiqueta} no coincide con la versión ${manifiesto.version}.`);
const paquete = JSON.parse(await fs.readFile("package.json"));
if (paquete.version !== manifiesto.version) errores.push(`package.json (${paquete.version}) y system.json (${manifiesto.version}) no coinciden.`);
if (!manifiesto.download.includes("releases/latest/download") || !manifiesto.manifest.includes("releases/latest/download")) errores.push("manifest/download deben apuntar a releases/latest/download.");

const js = [...(await listar("module")), ...(await listar("scripts")), ...(await listar("tests"))].filter(f => f.endsWith(".mjs"));
for (const f of js) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { errores.push(`${f}: ${e.stderr}`); }
}
for (const f of ["system.json", "lang/es.json", "package.json", "_data/reglas-srd.json"]) {
  try { JSON.parse(await fs.readFile(f, "utf8")); }
  catch (e) { errores.push(`${f}: JSON inválido (${e.message})`); }
}

// Toda ruta systems/ysystem3-srd/... citada debe existir.
const fuentes = [...js, ...(await listar("templates")), "system.json", "styles/ysystem3.css"].filter(f => /\.(mjs|hbs|json|css)$/.test(f));
for (const f of fuentes) {
  const texto = await fs.readFile(f, "utf8");
  for (const [, ruta] of texto.matchAll(/systems\/ysystem3-srd\/([\w\-/.]+\.(?:hbs|webp|png|svg|css|woff2))/g)) {
    if (!(await existe(ruta))) errores.push(`${f}: falta ${ruta}`);
  }
  for (const [, ruta] of texto.matchAll(/\$\{RUTA\}\/([\w\-/.]+\.(?:hbs|webp|svg))/g)) {
    if (!(await existe(ruta))) errores.push(`${f}: falta ${ruta}`);
  }
}
for (const f of [...manifiesto.styles, ...manifiesto.esmodules, manifiesto.license]) if (!(await existe(f))) errores.push(`system.json: falta ${f}`);
for (const p of manifiesto.packs) if (!p.path.startsWith("packs/")) errores.push(`pack ${p.name}: ruta inesperada`);
for (const m of [manifiesto.background, ...manifiesto.media.map(x => x.url)]) if (!(await existe(m.replace("systems/ysystem3-srd/", "")))) errores.push(`system.json: falta ${m}`);

// Fuentes de compendios y reglas.
const { PACKS } = await import("../module/contenido.mjs");
for (const p of manifiesto.packs) if (!PACKS[p.name]) errores.push(`Falta la fuente del compendio ${p.name}.`);
for (const k of Object.keys(PACKS)) if (!manifiesto.packs.some(p => p.name === k)) errores.push(`El compendio ${k} no está en system.json.`);
const { CONJUNTOS } = await import("../module/config.mjs");
const { ARQUETIPOS } = await import("../module/arquetipos-data.mjs");
for (const a of ARQUETIPOS) for (const k of [...a.d3, ...a.d2]) if (!CONJUNTOS.srd.habilidades[k]) errores.push(`plantilla ${a.name}: habilidad desconocida ${k}`);
if (!PACKS["talentos-ysystem3"].docs().length) errores.push("No hay talentos.");

// Todo botón de las plantillas apunta a una acción de las hojas.
const hojas = await fs.readFile("module/hojas.mjs", "utf8") + await fs.readFile("module/creador.mjs", "utf8") + await fs.readFile("module/director.mjs", "utf8");
for (const f of await listar("templates")) {
  if (!f.endsWith(".hbs")) continue;
  const t = await fs.readFile(f, "utf8");
  for (const [, accion] of t.matchAll(/data-action="([A-Za-z]+)"/g)) {
    if (accion === "tab") continue;
    if (!new RegExp(`\\b${accion}\\b`).test(hojas) && !(await fs.readFile("module/retrato.mjs", "utf8")).includes(accion)) errores.push(`${f}: la acción «${accion}» no existe en ningún módulo.`);
  }
}

if (errores.length) { console.error(errores.join("\n")); process.exit(1); }
console.log(`Comprobación correcta: ${js.length} módulos, ${fuentes.length} fuentes revisadas.`);
