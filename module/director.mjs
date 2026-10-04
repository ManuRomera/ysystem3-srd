/**
 * Panel del DJ: todos los PJ de un vistazo y las acciones de mesa que el SRD reparte por capítulos
 * (pánico, premiar proezas y Experiencia, nueva sesión, nuevo día, nueva aventura, tortura y duelos).
 */
import { ApplicationV2, HandlebarsApplicationMixin } from "./compat.mjs";
import { ConMemoria } from "./memoria.mjs";
import { ID, RUTA } from "./config.mjs";
import { contexto } from "./ajustes.mjs";
import { publicar } from "./chat.mjs";
import { lanzarPanico, resolverTortura, publicarDuelo, mostrar } from "./flujos.mjs";
import { pedirDatos, confirmar } from "./dialogos.mjs";
import { pintarRetratos } from "./retrato.mjs";

const esc = foundry.utils.escapeHTML;
const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const personajes = () => game.actors.filter(a => a.type === "personaje");
const objetivos = () => [...game.user.targets].map(t => t.actor).filter(Boolean);
const controlados = () => (canvas?.tokens?.controlled ?? []).map(t => t.actor).filter(Boolean);

export class PanelDirector extends ConMemoria(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS = {
    id: "ysystem3-director", classes: ["ysystem3", "ys-director"],
    position: { width: 620, height: 600 },
    window: { title: "Panel del DJ", icon: "fa-solid fa-crown", resizable: true },
    actions: {
      abrir: PanelDirector.#abrir, premiar: PanelDirector.#premiar, xp: PanelDirector.#xp, xpTodos: PanelDirector.#xpTodos, cita: PanelDirector.#cita,
      panico: PanelDirector.#panico, panicoPnj: PanelDirector.#panicoPnj, sesion: PanelDirector.#sesion, dia: PanelDirector.#dia, aventura: PanelDirector.#aventura,
      tortura: PanelDirector.#tortura, duelo: PanelDirector.#duelo, danoRegla: PanelDirector.#danoRegla, curacion: PanelDirector.#curacion
    }
  };

  static MEMORIA = "director";
  static PARTS = { cuerpo: { template: `${RUTA}/templates/apps/director.hbs`, scrollable: [".ys-cuerpo"] } };

  static abrir() { return new PanelDirector().render({ force: true }); }

  async _onRender(context, options) {
    await super._onRender(context, options);
    pintarRetratos(this.element);
  }

  async _prepareContext() {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const pjs = personajes().sort((a, b) => a.name.localeCompare(b.name, "es")).map(a => {
      const s = a.system;
      const estados = [];
      if (s.estado.muerto) estados.push("Muerto");
      else if (s.estado.fueraDeJuego) estados.push("Fuera de juego");
      else if (s.estado.inconsciente) estados.push("Inconsciente");
      if (s.estado.crisisMental) estados.push("Crisis mental");
      if (s.combate.sorprendido) estados.push("Sorprendido");
      if (s.combate.inmovilizado) estados.push("Inmovilizado");
      return {
        id: a.id, nombre: a.name, img: a.img, jugador: s.datos.jugador,
        salud: s.salud.valor, max: s.salud.max, pct: Math.max(0, Math.min(100, (100 * s.salud.valor) / Math.max(1, s.salud.max))), penal: s.penalizadorDados,
        estabilidad: s.estabilidad.valor, maxE: cj.tienePanico ? s.estabilidad.max : 0, pctE: Math.max(0, Math.min(100, (100 * s.estabilidad.valor) / Math.max(1, s.estabilidad.max))),
        proezas: s.proezas.valor, inicial: s.proezas.inicial, leve: s.defectos.leveUsado, recuerdo: s.recuerdo.usado, xp: s.xpDisponible, estados,
        agilidad: a.valorFijo("agilidad"), aplomo: a.valorFijo("aplomo"), perspicacia: cj.fijos.perspicacia ? a.valorFijo("perspicacia") : null
      };
    });
    return {
      pjs, vacio: !pjs.length, cj, conPanico: cj.tienePanico, edicion: ctx.edicion.nombre, variante: ctx.variante.label, pulp: ctx.pulp,
      reglas: Object.entries(ctx.opciones).filter(([, v]) => v).map(([k]) => k),
      dias: game.settings.get(ID, "dias")
    };
  }

  static #abrir(ev, b) { game.actors.get(b.dataset.id)?.sheet.render(true); }

  static async #premiar(ev, b) {
    const a = game.actors.get(b.dataset.id);
    const cj = contexto().conjunto;
    await a?.ganarProeza(1, { silencioso: true });
    await publicar({ tono: "exito", icono: "fa-solid fa-star", etiqueta: cj.recurso, titulo: `+1 ${cj.recursoUno}`, texto: `${a.name} se lleva una ${cj.recursoUno} del DJ.` }, { actor: a });
  }

  /** Hack «soltar la cita tiene premio»: la primera vez (o siempre, a criterio del DJ). */
  static async #cita(ev, b) {
    const a = game.actors.get(b.dataset.id);
    await a?.ganarProeza(1, { silencioso: true });
    await publicar({ tono: "exito", icono: "fa-solid fa-quote-left", etiqueta: "La cita", titulo: "+1 proeza", texto: `${a.name} suelta su cita en el momento justo.` }, { actor: a });
  }

  static async #xp(ev, b) {
    const a = game.actors.get(b.dataset.id);
    const d = await pedirDatos({ titulo: `Experiencia · ${a.name}`, intro: "<p>De 1 a 3 puntos por objetivo alcanzado; 1 más por una interpretación brillante; 1 a 3 al terminar la aventura por perseguir su motivación.</p>", filas: [{ nombre: "puntos", tipo: "num", etiqueta: "Puntos", valor: 1, min: 1, max: 9 }, { nombre: "motivo", tipo: "texto", etiqueta: "Motivo", valor: "" }], ok: "Dar" });
    if (d) await a.ganarXP(d.puntos, d.motivo);
  }

  static async #xpTodos() {
    const d = await pedirDatos({ titulo: "Experiencia para todos", filas: [{ nombre: "puntos", tipo: "num", etiqueta: "Puntos", valor: 1, min: 1, max: 9 }, { nombre: "motivo", tipo: "texto", etiqueta: "Motivo", valor: "" }], ok: "Dar a todos" });
    if (!d) return;
    for (const a of personajes()) await a.ganarXP(d.puntos, d.motivo);
  }

  static async #panico() {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const dianas = objetivos().filter(a => a.type === "personaje");
    if (!dianas.length) return ui.notifications.warn("Marca como objetivo a uno o varios PJ.");
    const max = cj.miedo?.max ?? (ctx.opciones.panicoAmpliado ? 10 : 7);
    const d = await pedirDatos({
      titulo: cj.tienePanico ? "Tirada de pánico" : "Tirada de miedo",
      intro: `<p>Gravedad de 1 (algo siniestro) a ${max} (absolutamente aterrador). Se tiran tantos D6 contra el ${esc(cj.fijos.aplomo)} de cada PJ; si lo igualan o superan, pierde ${cj.tienePanico ? "Estabilidad" : "Salud"} igual al número de dados. Sin críticos ni pifias.</p>`,
      filas: [
        { nombre: "dados", tipo: "num", etiqueta: "Gravedad (dados)", valor: 1, min: 1, max },
        ...(cj.tienePanico ? [{ nombre: "habituado", tipo: "check", etiqueta: "Habituado por su profesión (+3 al Aplomo)", valor: false }] : []),
        ...(ctx.opciones.habituarse ? [{ nombre: "repeticiones", tipo: "num", etiqueta: "Veces que ya se han enfrentado a este horror", valor: 0, min: 0, max: 7 }] : [])
      ],
      ok: "Lanzar"
    });
    if (d) await lanzarPanico(dianas, { dados: Math.max(1, Math.min(max, d.dados)), habituado: Boolean(d.habituado), repeticiones: n(d.repeticiones) });
  }

  /** Cap. 6: 2D contra el Aplomo de cada PNJ para ver si huyen en pleno combate. */
  static async #panicoPnj() {
    const pnjs = objetivos().filter(a => a.type === "pnj");
    if (!pnjs.length) return ui.notifications.warn("Marca como objetivo a uno o varios PNJ.");
    const lineas = [];
    const rolls = [];
    for (const a of pnjs) {
      const roll = await new Roll("2d6").evaluate();
      await mostrar(roll);
      rolls.push(roll);
      const ap = a.valorFijo("aplomo");
      lineas.push({ texto: `<strong>${esc(a.name)}</strong>: 2D = ${roll.total} contra Aplomo ${ap} → ${roll.total >= ap ? "<b>entra en pánico y huye</b>" : "aguanta el tipo"}.` });
    }
    await publicar({ tono: "aviso", icono: "fa-solid fa-person-running", etiqueta: "Pánico de PNJ", titulo: "¿Huyen?", lineas }, { alias: "DJ", rolls });
  }

  static async #sesion() {
    const ctx = contexto();
    if (!(await confirmar({ titulo: "Nueva sesión", contenido: `<p>Cada PJ recupera sus ${ctx.conjunto.recurso.toLowerCase()} iniciales (se pierden las sobrantes), vuelve el ${esc(ctx.conjunto.defectoLeve.toLowerCase())}, se borran los umbrales de Salud y Estabilidad, las curaciones por sesión y los usos de los talentos.${ctx.pulp ? " Anexo Pulp: cada uno tira 1D y gana la mitad en proezas extra." : ""}</p>`, si: "Empezar sesión" }))) return;
    const lineas = [];
    for (const a of personajes()) {
      const r = await a.nuevaSesion();
      const notas = [];
      if (r.sobran) notas.push(`pierde ${r.sobran} de más`);
      if (r.extra) notas.push(`+${r.extra} por el Anexo Pulp (1D = ${r.roll.total})`);
      if (a.system.estado.muerto) notas.push("ha fallecido");
      lineas.push({ texto: `<strong>${esc(a.name)}</strong>: ${a.system.proezas.inicial + (r.extra || 0)} ${ctx.conjunto.recurso.toLowerCase()}${notas.length ? ` (${notas.map(esc).join("; ")})` : ""}.` });
    }
    await publicar({ tono: "aviso", icono: "fa-solid fa-play", etiqueta: "Nueva sesión", titulo: "¡Empezamos!", lineas }, { alias: "DJ" });
    this.render();
  }

  static async #dia() {
    const dias = n(game.settings.get(ID, "dias")) + 1;
    const tercero = dias % 3 === 0;
    await game.settings.set(ID, "dias", dias);
    const lineas = [];
    for (const a of personajes()) {
      const r = await a.nuevoDia({ tercerDia: tercero });
      if (r.length) lineas.push({ texto: `<strong>${esc(a.name)}</strong>: ${r.map(esc).join(", ")}.` });
    }
    await publicar({
      tono: "aviso", icono: "fa-solid fa-sun", etiqueta: `Día ${dias}`, titulo: "Amanece", lineas: lineas.length ? lineas : undefined,
      texto: `Las curaciones «una vez al día» vuelven a estar disponibles${tercero ? ", y también las que se renuevan cada tres días" : ""}.`
    }, { alias: "DJ" });
    this.render();
  }

  static async #aventura() {
    const d = await pedirDatos({
      titulo: "Nueva aventura", intro: "<p>Vuelven el Recuerdo cuando…, el punto de guion, la tirada de salvación Pulp y las curaciones. No se supera la Salud ni la Estabilidad que cada PJ tenía al empezar la aventura.</p>",
      filas: [{ nombre: "restaurar", tipo: "check", etiqueta: "Restaurar también Salud y Estabilidad al máximo", valor: false }], ok: "Empezar aventura"
    });
    if (!d) return;
    for (const a of personajes()) await a.nuevaAventura({ restaurar: d.restaurar });
    await game.settings.set(ID, "dias", 0);
    await publicar({ tono: "exito", icono: "fa-solid fa-flag-checkered", etiqueta: "Nueva aventura", titulo: "Nueva aventura", texto: "Todo listo: Recuerdo, punto de guion y curaciones renovados." }, { alias: "DJ" });
    this.render();
  }

  /** Tortura opcional: el primer token controlado interroga al primer objetivo marcado. */
  static async #tortura() {
    const [verdugo] = controlados();
    const [victima] = objetivos();
    if (!verdugo || !victima) return ui.notifications.warn("Selecciona al interrogador y marca como objetivo a la víctima.");
    return resolverTortura(verdugo, victima);
  }

  static async #duelo() {
    const marcados = [...new Set([...controlados(), ...objetivos()])];
    if (marcados.length < 2) return ui.notifications.warn("Selecciona o marca a los dos duelistas.");
    return publicarDuelo(marcados[0], marcados[1]);
  }

  static #danoRegla() { const a = controlados()[0] ?? game.user.character; return a ? a.danoRegla() : ui.notifications.warn("Selecciona un token."); }
  static #curacion() { const a = controlados()[0] ?? game.user.character; return a ? a.curacionRegla() : ui.notifications.warn("Selecciona un token."); }
}

/** Los cambios de PJ repintan el panel abierto. */
export function repintarPanel() {
  for (const app of foundry.applications.instances.values()) if (app instanceof PanelDirector) app.render();
}
