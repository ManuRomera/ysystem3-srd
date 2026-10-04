/**
 * Asistente de creación (SRD cap. 7): creación libre, por plantilla o al azar, para cualquier conjunto de reglas.
 * Crea una ficha nueva o aplica sobre una existente. También genera PNJ rápidos (anexo del cap. 7).
 */
import { ApplicationV2, HandlebarsApplicationMixin } from "./compat.mjs";
import { ConMemoria } from "./memoria.mjs";
import { RUTA, HABILIDADES_PNJ, etiquetaAtributo, etiquetaHabilidad, normalizarHabilidades } from "./config.mjs";
import * as R from "./reglas.mjs";
import { contexto } from "./ajustes.mjs";
import { ARQUETIPOS, archetypeSkills, archetypeSystem, archetypeTalentItem, arquetipoByKey } from "./arquetipos-data.mjs";
import { GENERADOR } from "./generador-data.mjs";
import { IMSERSO_GENERATOR_DATA as YAYO } from "./imserso-generator-data.mjs";
import { publicar } from "./chat.mjs";
import { pedirDatos } from "./dialogos.mjs";

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clon = v => foundry.utils.deepClone(v);
const mezclar = lista => { const a = [...lista]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const elegir = lista => lista[Math.floor(Math.random() * lista.length)];

const PASOS = [
  { id: "modo", etiqueta: "Método" }, { id: "datos", etiqueta: "Datos" }, { id: "reglas", etiqueta: "Reglas" },
  { id: "defectos", etiqueta: "Defectos" }, { id: "resumen", etiqueta: "Resumen" }
];

const nombreVacio = nombre => !nombre || /^(nuevo|nueva|pj|pnj|actor|personaje|new)\b/i.test(nombre.trim());
const yayo = () => contexto().conjunto.id !== "srd";

function nombreAleatorio() {
  if (yayo()) return `${elegir(YAYO.firstNames)} ${elegir(YAYO.surnames)} ${elegir(YAYO.nicknames)}`;
  return `${elegir(GENERADOR.nombres)} ${elegir(GENERADOR.apodos)}`;
}

function atributosIniciales(cj) {
  const valores = mezclar(cj.bonificadores);
  return Object.fromEntries(Object.keys(cj.atributos).map((k, i) => [k, valores[i] ?? 0]));
}

function desdeActor(actor) {
  const cj = contexto().conjunto;
  const s = actor?.system ?? {};
  const arq = arquetipoByKey(s.datos?.arquetipo);
  const base = Object.fromEntries(Object.keys(cj.atributos).map((k, i) => [k, cj.bonificadores[i] ?? 0]));
  const atributos = actor && s.atributos ? Object.fromEntries(Object.keys(cj.atributos).map(k => [k, n(s.atributos[k])])) : base;
  return {
    modo: arq ? "arquetipo" : "libre", paso: 0, nombre: actor && !nombreVacio(actor.name) ? actor.name : "", img: actor?.img ?? "icons/svg/mystery-man.svg",
    arquetipoKey: arq?.key ?? "", tiradaSalud: 0, tiradaEstabilidad: 0,
    datos: {
      jugador: s.datos?.jugador || game.user.name, lugarNacimiento: s.datos?.lugarNacimiento ?? "", edad: s.datos?.edad ?? "", profesion: s.datos?.profesion ?? "",
      perfil: s.datos?.perfil ?? "", motivacion: s.datos?.motivacion ?? "", descripcionFisica: s.datos?.descripcionFisica ?? "", situacionFamiliar: s.datos?.situacionFamiliar ?? "",
      cita: s.datos?.cita ?? "", pertenencias: s.datos?.pertenencias ?? ""
    },
    atributos, habilidades: actor ? normalizarHabilidades(s.habilidades) : normalizarHabilidades({}),
    defectos: { grave: s.defectos?.grave ?? "", leve: s.defectos?.leve ?? "" }
  };
}

export class Creador extends ConMemoria(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS = {
    id: "ysystem3-creador", classes: ["ysystem3", "ys-creador"], tag: "form",
    position: { width: 720, height: 760 },
    window: { icon: "fa-solid fa-wand-magic-sparkles", resizable: true },
    form: { handler: Creador.#leer, submitOnChange: true, closeOnSubmit: false },
    actions: {
      paso: Creador.#paso, siguiente: Creador.#siguiente, anterior: Creador.#anterior, aplicar: Creador.#aplicar,
      salud: Creador.#salud, defectos: Creador.#defectos, aleatorio: Creador.#aleatorio, modo: Creador.#modo, datos: Creador.#datosAzar
    }
  };

  static MEMORIA = "creador";
  static SCROLL_MEMORIA = [".ys-cuerpo"];
  static PARTS = { cuerpo: { template: `${RUTA}/templates/apps/creador.hbs`, scrollable: [".ys-cuerpo"] } };

  constructor(actor = null, options = {}) {
    super(options);
    this.actor = actor;
    this.e = desdeActor(actor);
  }

  get title() { return this.actor ? `Asistente · ${this.actor.name}` : "Asistente de creación de PJ"; }

  /** Lo que valdría la ficha con el método y las elecciones actuales. */
  _construir() {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const e = this.e;
    const arq = e.modo === "arquetipo" && !yayo() ? arquetipoByKey(e.arquetipoKey) : null;
    const atributos = arq ? clon(arq.attrs) : { ...e.atributos };
    const habilidades = arq ? archetypeSkills(arq) : normalizarHabilidades(e.habilidades);
    const fue = n(atributos.fue), int = n(atributos.int), car = n(atributos.car), des = n(atributos.des), per = n(atributos.per);
    const agil = R.agilidad(habilidades.atletismo.dados, des);
    const apl = cj.id === "srd" ? R.aplomo(car, int) : R.bemoles(int);
    const base = arq ? arq.saludBase : R.saludBase(fue);
    const estBase = R.estabilidadBase(R.aplomo(car, int));
    return {
      arq, atributos, habilidades, proezas: arq ? arq.proezas : R.proezasIniciales(fue, int, cj.id === "srd" ? 3 : 2),
      agilidad: agil, aplomo: apl, perspicacia: cj.fijos.perspicacia ? R.perspicacia(int, per) : "", rf: arq ? arq.resistenciaFisica : R.resistenciaFisica(fue), rm: R.resistenciaMental(car),
      iniciativa: cj.id === "srd" ? R.iniciativa(des, int) : des, saludBase: base, salud: base + n(e.tiradaSalud), estBase, estabilidad: estBase + n(e.tiradaEstabilidad)
    };
  }

  _avisos(c) {
    const cj = contexto().conjunto;
    const e = this.e;
    const av = [];
    if (!e.nombre.trim()) av.push("Falta el nombre del PJ.");
    if (e.modo === "arquetipo" && !c.arq) av.push("Elige una plantilla.");
    if (e.modo !== "arquetipo") {
      const r = R.repartoLibre(c.atributos, c.habilidades, cj);
      if (!r.atributosOk) av.push(`Reparte una vez cada bonificador: ${cj.bonificadores.map(b => (b > 0 ? `+${b}` : b)).join(", ")}.`);
      if (r.d3 !== r.objetivo3) av.push(`Hacen falta exactamente ${r.objetivo3} habilidades a 3D (ahora ${r.d3}).`);
      if (r.d2 !== r.objetivo2) av.push(`Hacen falta exactamente ${r.objetivo2} habilidades a 2D (ahora ${r.d2}).`);
      if (!r.idiomaOk) av.push("El segundo idioma exige 2D o 3D en el primero.");
    }
    if (!e.defectos.grave.trim() || !e.defectos.leve.trim()) av.push(`Faltan los dos ${cj.defectoGrave.toLowerCase().includes("achaque") ? "achaques" : "defectos"}.`);
    if (!e.tiradaSalud) av.push("Falta tirar la Salud inicial (1D6).");
    if (cj.tienePanico && !e.tiradaEstabilidad) av.push("Falta tirar la Estabilidad inicial (1D6).");
    return av;
  }

  async _prepareContext() {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const e = this.e;
    const c = this._construir();
    const dados = h => n(e.habilidades[h]?.dados, 1);
    const cuentas = { d3: Object.keys(cj.habilidades).filter(k => dados(k) === 3).length, d2: Object.keys(cj.habilidades).filter(k => dados(k) === 2).length };
    const objetivo2 = cj.id === "srd" ? 8 : 6;
    const avisos = this._avisos(c);
    const arquetipos = yayo() ? [] : ARQUETIPOS.map(a => ({ ...a, activo: a.key === e.arquetipoKey, d3t: a.d3.map(k => etiquetaHabilidad(k, cj)).join(", "), d2t: a.d2.map(k => etiquetaHabilidad(k, cj)).join(", ") }));
    return {
      e, c, cj, actorExistente: Boolean(this.actor), paso: PASOS[e.paso].id, pasos: PASOS.map((p, i) => ({ ...p, i, activo: i === e.paso, hecho: i < e.paso })),
      primero: e.paso === 0, ultimo: e.paso === PASOS.length - 1, arquetipos, sinArquetipos: yayo(),
      elegido: c.arq && { ...c.arq, d3t: c.arq.d3.map(k => etiquetaHabilidad(k, cj)).join(", "), d2t: c.arq.d2.map(k => etiquetaHabilidad(k, cj)).join(", ") },
      libre: e.modo !== "arquetipo", conPanico: cj.tienePanico,
      atributos: Object.entries(cj.atributos).map(([k, a]) => ({ k, ...a, valor: n(e.atributos[k]), opciones: cj.bonificadores })),
      habilidades: Object.entries(cj.habilidades).sort(([, a], [, b]) => a.label.localeCompare(b.label, "es")).map(([k, h]) => ({
        k, etiqueta: h.label, atr: etiquetaAtributo(h.atributo, cj), dados: dados(k), bloq3: cuentas.d3 >= 4 && dados(k) !== 3, bloq2: cuentas.d2 >= objetivo2 && dados(k) !== 2
      })),
      cuentas, objetivo2, avisos, listo: avisos.length === 0,
      resumenHabilidades: {
        d3: Object.entries(c.habilidades).filter(([k, h]) => cj.habilidades[k] && h.dados === 3).map(([k]) => etiquetaHabilidad(k, cj)).join(", "),
        d2: Object.entries(c.habilidades).filter(([k, h]) => cj.habilidades[k] && h.dados === 2).map(([k]) => etiquetaHabilidad(k, cj)).join(", ")
      },
      etiquetaProfesion: cj.profesion, etiquetaRecurso: cj.recurso, etiquetaRF: cj.rf, etiquetaRM: cj.rm,
      etiquetaGrave: cj.defectoGrave, etiquetaLeve: cj.defectoLeve,
      fijos: Object.entries(cj.fijos).filter(([, v]) => v).map(([rol, etiqueta]) => ({ etiqueta, valor: rol === "agilidad" ? c.agilidad : rol === "aplomo" ? c.aplomo : c.perspicacia }))
    };
  }

  /** Formulario → estado. Un bonificador repetido intercambia su valor con el atributo que ya lo tenía. */
  static async #leer(event, form, formData) {
    const d = foundry.utils.expandObject(formData.object);
    const e = this.e;
    const cj = contexto().conjunto;
    if (d.nombre !== undefined) e.nombre = d.nombre;
    if (d.modo) e.modo = d.modo;
    if (d.arquetipoKey !== undefined) e.arquetipoKey = d.arquetipoKey;
    Object.assign(e.datos, d.datos ?? {});
    Object.assign(e.defectos, d.defectos ?? {});
    for (const [k, v] of Object.entries(d.atributos ?? {})) {
      const antes = e.atributos[k];
      const otro = Object.keys(e.atributos).find(o => o !== k && e.atributos[o] === n(v));
      e.atributos[k] = n(v);
      if (otro) e.atributos[otro] = antes;
    }
    const objetivo2 = cj.id === "srd" ? 8 : 6;
    for (const [k, v] of Object.entries(d.habilidades ?? {})) {
      const antes = n(e.habilidades[k].dados, 1), nuevo = n(v, 1);
      const cuenta = x => Object.keys(cj.habilidades).filter(h => n(e.habilidades[h]?.dados) === x).length;
      e.habilidades[k] = { dados: nuevo };
      if ((nuevo === 3 && antes !== 3 && cuenta(3) > 4) || (nuevo === 2 && antes !== 2 && cuenta(2) > objetivo2)) {
        e.habilidades[k] = { dados: antes };
        ui.notifications.warn(`Ya hay ${nuevo === 3 ? "4 habilidades a 3D" : `${objetivo2} habilidades a 2D`}: baja otra antes.`);
      }
    }
    this.render();
  }

  static #paso(ev, b) { this.e.paso = n(b.dataset.i); this.render(); }
  static #siguiente() { this.e.paso = Math.min(PASOS.length - 1, this.e.paso + 1); this.render(); }
  static #anterior() { this.e.paso = Math.max(0, this.e.paso - 1); this.render(); }
  static #modo(ev, b) { this.e.modo = b.dataset.modo; if (b.dataset.modo === "aleatorio") return Creador.#aleatorio.call(this); this.render(); }

  static async #salud() {
    const cj = contexto().conjunto;
    const roll = await new Roll(cj.tienePanico ? "2d6" : "1d6").evaluate();
    const caras = roll.dice[0].results.map(r => r.result);
    this.e.tiradaSalud = caras[0];
    if (cj.tienePanico) this.e.tiradaEstabilidad = caras[1];
    await publicar({
      tono: "aviso", icono: "fa-solid fa-heart-pulse", etiqueta: "Salud inicial", titulo: cj.tienePanico ? `Salud 1D6 = ${caras[0]} · Estabilidad 1D6 = ${caras[1]}` : `1D6 = ${caras[0]}`
    }, { rolls: [roll], alias: "Asistente" });
    this.render();
  }

  static #datosAzar() {
    Object.assign(this.e.datos, datosAleatorios(this.e.datos));
    this.render();
  }

  static #defectos() {
    this.e.defectos = defectosAleatorios();
    this.render();
  }

  static async #aleatorio() {
    const g = await generarAleatorio(this.e);
    Object.assign(this.e, g, { modo: "aleatorio", paso: PASOS.findIndex(p => p.id === "resumen") });
    this.render();
  }

  static async #aplicar() {
    const e = this.e;
    const cj = contexto().conjunto;
    if (e.modo === "aleatorio" && !R.repartoLibre(e.atributos, e.habilidades, cj).ok) Object.assign(e, await generarAleatorio(e));
    const c = this._construir();
    const avisos = this._avisos(c);
    if (avisos.length) { ui.notifications.warn(avisos[0]); return this.render(); }
    const umbrales = Object.fromEntries(R.UMBRALES.map(u => [u, false]));
    const cambios = {
      name: e.nombre.trim(), img: e.img,
      ...Object.fromEntries(Object.entries(e.datos).map(([k, v]) => [`system.datos.${k}`, v])),
      "system.defectos.grave": e.defectos.grave, "system.defectos.leve": e.defectos.leve, "system.defectos.leveUsado": false,
      "system.recuerdo.usado": false, "system.recuerdo.usos": 0,
      "system.proezas.valor": c.proezas, "system.proezas.inicial": c.proezas,
      "system.salud.valor": c.salud, "system.salud.max": c.salud,
      "system.resistenciaFisica.valor": c.rf, "system.resistenciaFisica.primeraTirada": false, "system.resistenciaFisica.umbrales": umbrales,
      "system.atributos": { car: 0, des: 0, fue: 0, int: 0, per: 0, ...c.atributos }, "system.habilidades": c.habilidades
    };
    if (cj.tienePanico) {
      Object.assign(cambios, {
        "system.estabilidad.valor": c.estabilidad, "system.estabilidad.max": c.estabilidad,
        "system.resistenciaMental.valor": c.rm, "system.resistenciaMental.primeraTirada": false, "system.resistenciaMental.umbrales": { ...umbrales }
      });
    }
    if (c.arq) Object.assign(cambios, archetypeSystem(c.arq, n(e.tiradaSalud, 1), n(e.tiradaEstabilidad, 1)));
    else Object.assign(cambios, { "system.datos.arquetipo": "Libre", "system.datos.talento": "" });
    const actor = this.actor ?? await Actor.create({ name: e.nombre.trim(), type: "personaje", img: e.img });
    await actor.update(cambios);
    if (c.arq && !actor.items.some(i => i.type === "talento" && i.name === c.arq.talentName)) await actor.createEmbeddedDocuments("Item", [archetypeTalentItem(c.arq)]);
    await publicar({
      tono: "exito", icono: "fa-solid fa-user-check", etiqueta: "PJ creado", titulo: actor.name,
      texto: `${c.arq ? `Plantilla ${c.arq.name}` : "Creación libre"}: ${c.proezas} ${cj.recurso.toLowerCase()}, Salud ${c.salud}${cj.tienePanico ? `, Estabilidad ${c.estabilidad}` : ""}, ${cj.rf} ${c.rf}.`
    }, { actor });
    actor.sheet.render(true);
    this.close();
  }
}

function datosAleatorios(previos = {}) {
  if (yayo()) {
    return {
      lugarNacimiento: elegir(YAYO.origins), profesion: elegir(YAYO.formerProfessions), edad: String(60 + Math.floor(Math.random() * 25)),
      motivacion: elegir(YAYO.tripGoals), descripcionFisica: elegir(YAYO.quirks), situacionFamiliar: "Nietos, hijos y un grupo de WhatsApp familiar que no se calla nunca.",
      cita: previos.cita ?? ""
    };
  }
  return {
    lugarNacimiento: elegir(GENERADOR.lugares), profesion: elegir(GENERADOR.perfiles), edad: String(20 + Math.floor(Math.random() * 40)),
    motivacion: elegir(GENERADOR.motivaciones), descripcionFisica: elegir(GENERADOR.fisico), situacionFamiliar: elegir(GENERADOR.familia), cita: elegir(GENERADOR.citas)
  };
}

function defectosAleatorios() {
  if (yayo()) { const [a, b] = mezclar(YAYO.achaques); return { grave: a, leve: b }; }
  return { grave: elegir(GENERADOR.defectosGraves), leve: elegir(GENERADOR.defectosLeves) };
}

/** PJ al azar con las reglas de creación libre del conjunto vigente. */
async function generarAleatorio(base = {}) {
  const cj = contexto().conjunto;
  const atributos = atributosIniciales(cj);
  const claves = mezclar(Object.keys(cj.habilidades).filter(k => k !== "idiomaExtranjero2"));
  const objetivo2 = cj.id === "srd" ? 8 : 6;
  const habilidades = normalizarHabilidades({});
  claves.slice(0, 4).forEach(k => { habilidades[k] = { dados: 3 }; });
  claves.slice(4, 4 + objetivo2).forEach(k => { habilidades[k] = { dados: 2 }; });
  const roll = await new Roll("2d6").evaluate();
  const caras = roll.dice[0].results.map(r => r.result);
  return {
    nombre: nombreVacio(base.nombre) ? nombreAleatorio() : base.nombre, atributos, habilidades, tiradaSalud: caras[0], tiradaEstabilidad: cj.tienePanico ? caras[1] : 0,
    defectos: defectosAleatorios(), datos: { ...(base.datos ?? {}), jugador: base.datos?.jugador || game.user.name, ...datosAleatorios(base.datos) }
  };
}

/** PNJ rápido (anexo del cap. 7): atributos de referencia, cuatro habilidades y Salud fija. */
export async function pnjAleatorio(actor, { referencia } = {}) {
  const cj = contexto().conjunto;
  const ref = referencia ?? elegir(Object.keys(R.REFERENCIAS_PNJ));
  const attrs = { ...R.REFERENCIAS_PNJ[ref].atributos };
  const dadosRef = { debil: 1, fuerte: 2, muyFuerte: 2, antagonista: 3 }[ref];
  const habilidades = normalizarHabilidades({});
  for (const k of HABILIDADES_PNJ) habilidades[k] = { dados: dadosRef };
  if (ref === "muyFuerte") { habilidades.lucha = { dados: 3 }; habilidades.punteria = { dados: 3 }; }
  const tipos = Object.keys(cj.ataques);
  const tipo = tipos.includes("cuerpoUnaMano") ? "cuerpoUnaMano" : tipos[1] ?? tipos[0];
  const cfg = cj.ataques[tipo];
  const salud = R.saludFija(attrs.fue, ref === "antagonista");
  const nombre = nombreAleatorio();
  await actor.update({
    name: nombreVacio(actor.name) ? nombre : actor.name, "system.rol": elegir(GENERADOR.roles), "system.bando": elegir(GENERADOR.bandos), "system.descripcion": elegir(GENERADOR.descripciones),
    "system.notas": `${R.REFERENCIAS_PNJ[ref].nota} (anexo del capítulo 7 del SRD).`,
    "system.atributos": { car: 0, des: 0, fue: 0, int: 0, per: 0, ...attrs }, "system.habilidades": habilidades, "system.salud.valor": salud, "system.salud.max": salud,
    "system.agilidad.manual": false, "system.aplomo.manual": false, "system.perspicacia.manual": false, "system.resistenciaFisica.manual": false,
    "system.ataque.tipo": tipo, "system.ataque.nombre": cfg.label, "system.ataque.habilidad": cfg.habilidad
  });
  return actor;
}

/** Crea un PNJ preguntando solo lo esencial. */
export async function crearPnj() {
  const op = Object.entries(R.REFERENCIAS_PNJ).map(([valor, r]) => ({ valor, etiqueta: r.nota }));
  const d = await pedirDatos({
    titulo: "Crear PNJ", intro: "<p>Los PNJ solo tienen cinco atributos, cuatro habilidades, Salud y valores fijos. Elige un modelo del anexo del SRD y retócalo después.</p>",
    filas: [{ nombre: "nombre", tipo: "texto", etiqueta: "Nombre (vacío = al azar)", valor: "" }, { nombre: "ref", tipo: "sel", etiqueta: "Modelo", valor: "fuerte", opciones: op }], ok: "Crear"
  });
  if (!d) return null;
  const actor = await Actor.create({ name: d.nombre?.trim() || "PNJ", type: "pnj", img: "icons/svg/mystery-man.svg" });
  await pnjAleatorio(actor, { referencia: d.ref });
  if (d.nombre?.trim()) await actor.update({ name: d.nombre.trim() });
  actor.sheet.render(true);
  return actor;
}

export const abrirCreador = actor => new Creador(actor).render({ force: true });
