/**
 * Compila los compendios a LevelDB desde las fuentes legibles del repositorio (module/contenido.mjs y _data/).
 * `packs/` no se versiona: se genera aquí, en CI y antes de cada publicación.
 */
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { ClassicLevel } from "classic-level";
import { PACKS } from "../module/contenido.mjs";

const manifiesto = JSON.parse(await fs.readFile("system.json"));
const RAIZ = { JournalEntry: "journal", Item: "items", Actor: "actors", RollTable: "tables", Macro: "macros" };
const EMBEBIDOS = { JournalEntry: ["pages"], Item: ["effects"], Actor: ["items", "effects"], RollTable: ["results"], Macro: [] };
const id = texto => createHash("sha1").update(texto).digest("hex").slice(0, 16);
const stats = { systemId: manifiesto.id, systemVersion: manifiesto.version, coreVersion: manifiesto.compatibility.verified, createdTime: null, modifiedTime: null, lastModifiedBy: null };
const base = (nombre, clave, i) => ({ _id: id(`${clave}-${nombre}`), folder: null, sort: (i + 1) * 1000, ownership: { default: 0 }, flags: {}, _stats: stats });

function documento(tipo, pack, origen, i) {
  const d = { ...origen };
  const b = base(d.name, `${pack}-${tipo}`, i);
  if (tipo === "JournalEntry") {
    return { ...b, name: d.name, pages: (d.pages ?? []).map((p, k) => ({
      _id: id(`pagina-${pack}-${d.name}-${p.name}`), name: p.name, type: "text", title: p.title ?? { show: true, level: 1 }, text: { format: 1, content: p.text?.content ?? p.text },
      sort: (k + 1) * 1000, ownership: { default: -1 }, flags: {}, _stats: stats
    })) };
  }
  if (tipo === "Item") return { ...b, name: d.name, type: d.type, img: d.img, system: d.system, effects: [] };
  if (tipo === "Actor") return { ...b, name: d.name, type: d.type, img: d.img, system: d.system, items: [], effects: [], prototypeToken: d.prototypeToken ?? { name: d.name } };
  if (tipo === "RollTable") {
    return { ...b, name: d.name, img: d.img, description: d.description ?? "", formula: d.formula, replacement: true, displayRoll: true,
      results: d.results.map((r, k) => ({ _id: id(`resultado-${pack}-${d.name}-${k}`), type: "text", name: "", description: r.text, img: null, weight: 1, range: r.range, drawn: false, flags: {} })) };
  }
  return { ...b, name: d.name, type: d.type, img: d.img, scope: d.scope, command: d.command, author: null };
}

/** Compilar con Foundry abierto destruye los packs: LevelDB recupera la base vacía. Se comprueba antes. */
async function comprobarCerrados(packs) {
  const bloqueados = [];
  for (const pack of packs) {
    if (!(await fs.stat(pack.path).catch(() => null))) continue;
    const db = new ClassicLevel(pack.path, { valueEncoding: "json" });
    try { await db.open(); await db.close(); }
    catch (error) {
      if ((error.cause?.code ?? error.code) === "LEVEL_LOCKED") bloqueados.push(pack.name);
      else throw error;
    }
  }
  if (bloqueados.length) throw new Error(`Foundry tiene abiertos estos packs: ${bloqueados.join(", ")}.\nCierra el mundo (o Foundry) antes de compilar.`);
}

await comprobarCerrados(manifiesto.packs);
await fs.mkdir("packs", { recursive: true });

for (const pack of manifiesto.packs) {
  const def = PACKS[pack.name];
  if (!def) throw new Error(`Falta la fuente del compendio ${pack.name} en module/contenido.mjs`);
  const documentos = def.docs().map((o, i) => documento(def.tipo, pack.name, o, i));
  // Actores con objetos embebidos (p. ej. PJ de Dungeons & Yayos): se reparten luego en sus claves.
  const origen = def.docs();
  const raiz = RAIZ[def.tipo];
  await fs.rm(pack.path, { recursive: true, force: true });
  const db = new ClassicLevel(pack.path, { valueEncoding: "json" });
  for (const [i, doc] of documentos.entries()) {
    const d = structuredClone(doc);
    for (const coleccion of EMBEBIDOS[def.tipo]) {
      const filas = coleccion === "items" ? (origen[i].items ?? []).map((it, k) => ({ _id: id(`obj-${pack.name}-${d.name}-${k}-${it.name}`), sort: (k + 1) * 1000, flags: {}, effects: [], ...it })) : (d[coleccion] ?? []);
      d[coleccion] = filas.map(f => f._id);
      for (const fila of filas) await db.put(`!${raiz}.${coleccion}!${d._id}.${fila._id}`, fila);
    }
    await db.put(`!${raiz}!${d._id}`, d);
  }
  await db.close();
  console.log(`pack ${pack.name}: ${documentos.length} documentos`);
}
