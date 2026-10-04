/**
 * Ysystem3 SRD · punto de entrada.
 * Aquí solo se registran piezas y hooks; la lógica vive en el resto de `module/`.
 */
import { DocumentSheetConfig, anadirHerramienta, diagnostico, generacion, loadTemplates } from "./compat.mjs";
import { ID, RUTA, CONJUNTOS, VARIANTES, REGLAS_OPCIONALES } from "./config.mjs";
import { contexto, registrarAjustes, iniciarTema } from "./ajustes.mjs";
import * as R from "./reglas.mjs";
import { MODELOS_ACTOR, MODELOS_ITEM } from "./modelos.mjs";
import { ActorYsystem3 } from "./actor.mjs";
import { ItemYsystem3 } from "./item.mjs";
import { CombateYsystem3, CombatanteYsystem3, alCambiarAsalto, alTerminarCombate, pintarTracker } from "./combate.mjs";
import { HojaPersonaje, HojaPnj, HojaObjeto } from "./hojas.mjs";
import { abrirCreador, crearPnj } from "./creador.mjs";
import { PanelDirector, repintarPanel } from "./director.mjs";
import { escucharChat, publicar } from "./chat.mjs";
import { lanzarPanico } from "./flujos.mjs";
import { registrarAccesibilidad } from "./accesibilidad.mjs";
import { pintarRetratos, repintarRetratos } from "./retrato.mjs";
import { ARQUETIPOS } from "./arquetipos-data.mjs";

Hooks.once("init", () => {
  CONFIG.YSYSTEM = { ID, CONJUNTOS, VARIANTES, REGLAS_OPCIONALES, EDICIONES: R.EDICIONES };
  CONFIG.Actor.documentClass = ActorYsystem3;
  CONFIG.Item.documentClass = ItemYsystem3;
  CONFIG.Combat.documentClass = CombateYsystem3;
  CONFIG.Combatant.documentClass = CombatanteYsystem3;
  Object.assign(CONFIG.Actor.dataModels, MODELOS_ACTOR);
  Object.assign(CONFIG.Item.dataModels, MODELOS_ITEM);
  CONFIG.Actor.trackableAttributes = {
    personaje: { bar: ["salud", "estabilidad"], value: ["proezas.valor", "poder.valor"] },
    pnj: { bar: ["salud"], value: [] }
  };
  // La tirada real la monta CombatanteYsystem3 (1D6 fijo + valor de iniciativa); la fórmula solo documenta.
  CONFIG.Combat.initiative = { formula: "1d6 + @iniciativa", decimals: 0 };

  DocumentSheetConfig.registerSheet(Actor, ID, HojaPersonaje, { types: ["personaje"], makeDefault: true, label: "Ysystem3 · Ficha de PJ" });
  DocumentSheetConfig.registerSheet(Actor, ID, HojaPnj, { types: ["pnj"], makeDefault: true, label: "Ysystem3 · Ficha de PNJ" });
  DocumentSheetConfig.registerSheet(Item, ID, HojaObjeto, { makeDefault: true, label: "Ysystem3 · Objeto" });

  registrarAjustes();
  registrarAccesibilidad();

  Handlebars.registerHelper("inc", v => Number(v) + 1);
  loadTemplates([`${RUTA}/templates/partes/cabecera.hbs`, `${RUTA}/templates/partes/habilidades.hbs`, `${RUTA}/templates/partes/barra.hbs`, `${RUTA}/templates/partes/objeto-fila.hbs`]);

  // Nombres de las versiones 0.x: los usan macros y módulos existentes.
  game.ysystem3Srd = {
    config: CONFIG.YSYSTEM, arquetipos: ARQUETIPOS, reglas: R, diagnostico,
    rollSkill: (id, clave) => game.actors.get(id)?.tirarHabilidad(clave),
    rollResistenciaFisica: id => game.actors.get(id)?.tirarResistencia("fisica"),
    openCharacterCreator: o => (o?.type === "pnj" ? crearPnj() : abrirCreador()), abrirCreador, crearPnj,
    abrirPanel: () => PanelDirector.abrir(), lanzarPanico, contexto
  };
  game.ysystem = game.ysystem3Srd;
  game.imserso = game.ysystem3Srd;
});

Hooks.once("ready", async () => {
  iniciarTema();
  escucharChat();
  console.info(`Ysystem3 SRD ${game.system.version} · Foundry ${game.version} (generación ${generacion()}) · ${contexto().variante.label} · ${contexto().edicion.nombre}`);
  if (game.user.isGM) {
    await migrar();
    await bienvenida();
  }
});

async function bienvenida() {
  if (game.settings.get(ID, "bienvenida") === game.system.version) return;
  await game.settings.set(ID, "bienvenida", game.system.version);
  await publicar({
    tono: "aviso", icono: "fa-solid fa-dice-d6", etiqueta: `Ysystem3 SRD ${game.system.version}`, titulo: "Listo para jugar",
    lineas: [
      { texto: "Crea PJ con el <strong>asistente</strong> del directorio de Actores y lleva la mesa desde el <strong>Panel del DJ</strong> (icono de corona en los controles de escena)." },
      { texto: "Elige la <strong>ambientación</strong> y la <strong>edición de las reglas</strong> (Ysystem3 o Edición Revisada) en Configuración → Ajustes del sistema." },
      { texto: "Sistema no oficial: para jugar no necesitas el libro, porque el SRD completo está en el compendio «Reglas YSYSTEM3 SRD»." }
    ]
  }, { alias: "Ysystem3 SRD" });
}

/** Limpieza de mundos de la serie 0.x: hojas V1 fijadas, proezas iniciales vacías. */
async function migrar() {
  const tocar = [];
  for (const a of game.actors) {
    if (!["personaje", "pnj"].includes(a.type)) continue;
    const cambios = {};
    if (["core.ActorSheet", "ActorSheet"].includes(a.getFlag("core", "sheetClass"))) cambios["flags.core.-=sheetClass"] = null;
    if (a.type === "personaje" && !a.system.proezas.inicial && a.system.proezas.valor) cambios["system.proezas.inicial"] = a.system.proezas.valor;
    if (Object.keys(cambios).length) tocar.push({ _id: a.id, ...cambios });
  }
  if (tocar.length) {
    await Actor.updateDocuments(tocar);
    console.info(`Ysystem3 SRD | Migrados ${tocar.length} actores de la serie 0.x.`);
  }
  const items = game.items.filter(i => ["equipo", "arma", "talento", "arquetipo", "objeto", "armadura", "escudo", "poder"].includes(i.type) && ["core.ItemSheet", "ItemSheet"].includes(i.getFlag("core", "sheetClass")))
    .map(i => ({ _id: i.id, "flags.core.-=sheetClass": null }));
  if (items.length) await Item.updateDocuments(items);
}

/** PJ: ficha vinculada y barras de Salud y Estabilidad; PNJ: barra de Salud. */
Hooks.on("preCreateActor", (actor, datos) => {
  if (actor.type === "personaje") {
    actor.updateSource({ prototypeToken: { actorLink: true, bar1: { attribute: "salud" }, bar2: { attribute: "estabilidad" }, displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER, disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY, ...datos.prototypeToken } });
  } else if (actor.type === "pnj") {
    actor.updateSource({ prototypeToken: { bar1: { attribute: "salud" }, displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER, disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE, ...datos.prototypeToken } });
  }
});

/** Un PJ nuevo y vacío abre el asistente, solo para quien lo creó. */
Hooks.on("createActor", (actor, opciones, userId) => {
  if (userId !== game.user.id || actor.type !== "personaje" || actor.system.datos.arquetipo || actor.pack) return;
  if (!/^(new|nuevo|nueva|pj|personaje|actor)\b/i.test(actor.name.trim())) return;
  if (game.settings.get(ID, "asistente")) abrirCreador(actor);
});

Hooks.on("updateCombat", alCambiarAsalto);
Hooks.on("renderCombatTracker", (app, html) => { pintarTracker(app, html); pintarRetratos(html); });
Hooks.on("deleteCombat", alTerminarCombate);
Hooks.on("renderActorDirectory", (app, html) => pintarRetratos(html));
Hooks.on("updateActor", (actor, cambios) => {
  if (actor.type === "personaje") repintarPanel();
  if (foundry.utils.hasProperty(cambios, `flags.${ID}`) || "img" in cambios) repintarRetratos();
});

/** Accesos en el directorio de Actores. */
Hooks.on("renderActorDirectory", (app, html) => {
  const raiz = html instanceof HTMLElement ? html : html[0];
  const acciones = raiz?.querySelector(".header-actions");
  if (!acciones || acciones.querySelector(".ys-boton-dir")) return;
  const boton = (icono, texto, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ys-boton-dir";
    b.innerHTML = `<i class="fa-solid ${icono}" inert></i><span>${texto}</span>`;
    b.addEventListener("click", fn);
    acciones.append(b);
  };
  boton("fa-wand-magic-sparkles", "Asistente de PJ", () => abrirCreador());
  if (game.user.isGM) {
    boton("fa-user-secret", "PNJ rápido", () => crearPnj());
    boton("fa-crown", "Panel del DJ", () => PanelDirector.abrir());
  }
});

Hooks.on("getSceneControlButtons", controles => {
  if (!game.user.isGM) return;
  anadirHerramienta(controles, "tokens", { name: "ysDirector", title: "Panel del DJ", icon: "fa-solid fa-crown", onChange: () => PanelDirector.abrir() });
});
