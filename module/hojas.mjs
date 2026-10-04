/**
 * Hojas V2 de personaje, PNJ y objeto, con memoria de ventana.
 * Candado de edición: lo que cambia las reglas (atributos, dados, valores, borrados) solo se toca
 * desbloqueando; tirar, gastar proezas y escribir texto siempre funcionan.
 */
import { ActorSheetV2, ItemSheetV2, HandlebarsApplicationMixin } from "./compat.mjs";
import { ConMemoria } from "./memoria.mjs";
import { RUTA, HABILIDADES_PNJ, CLAVES_ATAQUE, etiquetaAtributo } from "./config.mjs";
import * as R from "./reglas.mjs";
import { contexto } from "./ajustes.mjs";
import { ayuda } from "./ayuda.mjs";
import { ARQUETIPOS } from "./arquetipos-data.mjs";
import { pedirDatos } from "./dialogos.mjs";
import { abrirCreador } from "./creador.mjs";
import { publicar } from "./chat.mjs";
import { EditorRetrato, pintarRetratos } from "./retrato.mjs";

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const signo = v => (v > 0 ? `+${v}` : `${v}`);
const mayus = t => (t ? t[0].toUpperCase() + t.slice(1) : "");

class HojaBase extends ConMemoria(HandlebarsApplicationMixin(ActorSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["ysystem3", "ys-hoja"],
    form: { submitOnChange: true },
    window: { resizable: true },
    actions: {
      editar: HojaBase.#editar, compacto: HojaBase.#compacto, retrato: HojaBase.#retrato, alternar: HojaBase.#alternar,
      tirar: HojaBase.#tirar, iniciativa: HojaBase.#iniciativa, ataque: HojaBase.#ataque, perseguir: HojaBase.#perseguir,
      defensaCompleta: HojaBase.#defensa, inmovilizar: HojaBase.#inmovilizar, zafarse: HojaBase.#zafarse, huir: HojaBase.#huir, cobertura: HojaBase.#cobertura,
      saludMas: HojaBase.#saludMas, saludMenos: HojaBase.#saludMenos, saludOtra: HojaBase.#saludOtra,
      reforzar: HojaBase.#reforzar, quitarRefuerzo: HojaBase.#quitarRefuerzo,
      itemUsar: HojaBase.#itemUsar, itemEquipar: HojaBase.#itemEquipar, itemChat: HojaBase.#itemChat,
      itemEditar: HojaBase.#itemEditar, itemBorrar: HojaBase.#itemBorrar, itemNuevo: HojaBase.#itemNuevo,
      danoRegla: HojaBase.#danoRegla, curacion: HojaBase.#curacion
    }
  };

  static SCROLL_MEMORIA = [".ys-cuerpo"];
  editando = false;

  get title() { return this.document.name; }

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const actor = this.document;
    const ctx = contexto();
    this.tabGroups.primary ??= "habilidades";
    return {
      ...base, actor, system: actor.system, editable: this.isEditable, editando: this.isEditable && this.editando,
      compacto: this.compacto, esGM: game.user.isGM, pestana: this.tabGroups.primary, cj: ctx.conjunto, variante: ctx.variante, ctx,
      sub: this._subtitulo(actor), marca: ctx.variante,
      titulosGrupos: { arma: "Armas", proteccion: "Protecciones", equipo: "Equipo", poder: "Poderes", talento: "Talentos", arquetipo: "Plantillas" },
      sinObjetos: actor.items.size === 0
    };
  }

  /** Línea bajo el nombre: lo esencial de la persona, escapada. */
  _subtitulo() { return ""; }

  /** Grupos de habilidades por atributo, con dados y total de cada una. */
  _grupos(actor, { poder = false } = {}) {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const ef = actor.system.efectivos;
    const pj = actor.esPJ;
    const fx = actor.fx;
    const filtro = pj ? () => true : k => HABILIDADES_PNJ.includes(k);
    const grupos = Object.entries(cj.atributos).map(([clave, a]) => {
      const bono = ef.atributos[clave];
      const habilidades = Object.entries(cj.habilidades).filter(([k, h]) => h.atributo === clave && filtro(k)).map(([k, h]) => {
        const dados = ef.habilidades[k].dados;
        const bloqueada = cj.id === "srd" && !R.idiomaDisponible(ef.habilidades.idiomaExtranjero1.dados, k);
        const dobla = fx.atributoDoble?.atributo === clave && fx.atributoDoble.habilidades.includes(k);
        const total = bono * (dobla ? 2 : 1);
        return {
          clave: k, etiqueta: h.label, dados, base: actor.system.habilidades[k].dados, total: `${dados}D${total ? signo(total) : ""}`,
          oposicion: h.oposicion ? cj.fijos[h.oposicion] : "", oposicionCorta: h.oposicion ? cj.fijos[h.oposicion].slice(0, 3) : "",
          ayuda: ayuda("skill", k), bloqueada,
          pips: [1, 2, 3].map(i => ({ i, activo: dados >= i, extra: dados >= i && actor.system.habilidades[k].dados < i }))
        };
      });
      return { clave, ...a, bono, bonoTexto: signo(bono), base: actor.system.atributos[clave], habilidades, ayuda: mayus(ayuda("attr", clave)) };
    }).filter(g => g.habilidades.length);
    if (poder && ctx.poderes) {
      const dados = n(actor.system.poder.dados);
      grupos.push({
        clave: "poder", label: ctx.poderes === "psionica" ? "Psiónica" : "Magia", short: "PODER", bono: 0, bonoTexto: "", base: 0, ayuda: ayuda("rule", "poder"), sinBono: true,
        habilidades: [{ clave: "magia", etiqueta: ctx.poderes === "psionica" ? "Psiónica" : "Magia", dados, base: dados, total: `${dados}D`, oposicion: "", ayuda: ayuda("rule", "poder"), poder: true, pips: [1, 2, 3].map(i => ({ i, activo: dados >= i })) }]
      });
    }
    return grupos;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.classList.toggle("compacto", this.compacto);
    this.element.classList.toggle("editando", this.editando);
    pintarRetratos(this.element);
    // Los dados de una habilidad se corrigen con un clic en el pip, solo con el candado abierto.
    for (const b of this.element.querySelectorAll("[data-pip]")) {
      b.addEventListener("click", ev => {
        ev.stopPropagation();
        if (!this.editando) return;
        const { habilidad, valor } = b.dataset;
        const ruta = habilidad === "magia" ? "system.poder.dados" : `system.habilidades.${habilidad}.dados`;
        const actual = habilidad === "magia" ? this.document.system.poder.dados : this.document.system.habilidades[habilidad].dados;
        const minimo = habilidad === "magia" ? 0 : 1;
        this.document.update({ [ruta]: n(valor) === actual ? Math.max(minimo, n(valor) - 1) : n(valor) });
      });
    }
  }

  static #editar() { this.editando = !this.editando; this.render(); }
  static #retrato() { return EditorRetrato.abrir(this.document); }
  static #compacto() { this.alternarCompacto(); }
  static #alternar(ev, b) { return this.document.update({ [b.dataset.campo]: !foundry.utils.getProperty(this.document, b.dataset.campo) }); }
  static #tirar(ev, b) {
    if (b.dataset.poder) return this.document.tirarHabilidad("magia");
    return this.document.tirarHabilidad(b.dataset.clave);
  }
  static #iniciativa() { return this.document.rollInitiative({ createCombatants: true }); }
  static #ataque() { return this.document.atacar(); }
  static #perseguir() { return this.document.perseguir(); }
  static #defensa() { return this.document.defensaCompleta(); }
  static #inmovilizar() { return this.document.inmovilizar(); }
  static #zafarse() { return this.document.zafarse(); }
  static #huir() { return this.document.huir(); }
  static #cobertura(ev, b) { return this.document.alternarCobertura(b.dataset.nivel); }
  static #saludMas() { return this.document.curar(1); }
  static #saludMenos() { return this.document.aplicarDano(1); }
  static #reforzar(ev, b) { return this.document.reforzar(b.dataset.rol); }
  static #quitarRefuerzo(ev, b) { return this.document.update({ [`system.combate.refuerzo${mayus(b.dataset.rol)}`]: 0 }); }
  static #danoRegla() { return this.document.danoRegla(); }
  static #curacion() { return this.document.curacionRegla(); }

  static async #saludOtra() {
    const d = await pedirDatos({
      titulo: `Salud · ${this.document.name}`,
      filas: [
        { nombre: "tipo", tipo: "sel", etiqueta: "Qué ocurre", valor: "dano", opciones: [{ valor: "dano", etiqueta: "Pierde Salud" }, { valor: "cura", etiqueta: "Recupera Salud" }] },
        { nombre: "cantidad", tipo: "num", etiqueta: "Puntos", valor: 1, min: 0 }
      ],
      ok: "Aplicar"
    });
    if (!d) return;
    return d.tipo === "dano" ? this.document.aplicarDano(d.cantidad) : this.document.curar(d.cantidad);
  }

  #item(boton) { return this.document.items.get(boton.closest("[data-item-id]")?.dataset.itemId); }
  static #itemUsar(ev, b) { return this.#item(b)?.usar(); }
  static #itemEquipar(ev, b) { return this.#item(b)?.alternarEquipado(); }
  static #itemChat(ev, b) { return this.#item(b)?.mostrarEnChat(); }
  static #itemEditar(ev, b) { return this.#item(b)?.sheet.render(true); }
  static #itemBorrar(ev, b) { return this.#item(b)?.delete(); }
  static #itemNuevo(ev, b) {
    const nombres = { arma: "Nueva arma", talento: "Nuevo talento", equipo: "Nuevo equipo", armadura: "Nueva armadura", escudo: "Nuevo escudo", poder: "Nuevo poder" };
    return this.document.createEmbeddedDocuments("Item", [{ name: nombres[b.dataset.tipo] ?? "Nuevo objeto", type: b.dataset.tipo }]);
  }

  /** Objetos del actor agrupados para la pestaña de equipo. */
  _objetos(actor) {
    const cj = contexto().conjunto;
    const sub = i => {
      const s = i.system;
      if (i.type === "arma") return `${cj.ataques[this._tipo(i)]?.label ?? ""}${s.danoBase ? ` · daño ${s.danoBase}` : ""}`;
      if (i.type === "armadura") return `Nivel ${s.nivel}`;
      if (i.type === "escudo") return `Nivel ${s.nivel}`;
      if (i.type === "talento") return s.usos.max ? `${s.usos.valor}/${s.usos.max} usos` : "siempre activo";
      if (i.type === "poder") return `Dificultad ${s.dificultad}`;
      if (i.type === "equipo" || i.type === "objeto") return s.cantidad > 1 ? `×${s.cantidad}` : "";
      return "";
    };
    const fila = i => ({
      id: i.id, nombre: i.name, img: i.img, sub: sub(i), equipado: i.system.equipado, tipo: i.type,
      equipable: ["arma", "armadura", "escudo"].includes(i.type), usable: i.type !== "equipo" && i.type !== "objeto" || Boolean(i.system.habilidadUso)
    });
    const por = (...t) => actor.items.filter(i => t.includes(i.type)).map(fila);
    return {
      arma: por("arma"), proteccion: por("armadura", "escudo"), equipo: por("equipo", "objeto"),
      poder: por("poder"), talento: por("talento"), arquetipo: por("arquetipo")
    };
  }

  _tipo(item) { return item.system.tipo; }
}

/* ---------------------------------------------------------------------- */

export class HojaPersonaje extends HojaBase {
  static DEFAULT_OPTIONS = {
    classes: ["ys-personaje"],
    position: { width: 720, height: 780 },
    window: { icon: "fa-solid fa-user" },
    actions: {
      tirarRF: HojaPersonaje.#tirarRF, tirarRM: HojaPersonaje.#tirarRM,
      proezaMas: HojaPersonaje.#proezaMas, proezaMenos: HojaPersonaje.#proezaMenos, premiar: HojaPersonaje.#premiar,
      estabilidadMas: HojaPersonaje.#estabilidadMas, estabilidadMenos: HojaPersonaje.#estabilidadMenos, estabilidadOtra: HojaPersonaje.#estabilidadOtra,
      guion: HojaPersonaje.#guion, poderMas: HojaPersonaje.#poderMas, poderMenos: HojaPersonaje.#poderMenos, descansar: HojaPersonaje.#descansar,
      arquetipo: HojaPersonaje.#arquetipo, creador: HojaPersonaje.#creador, mejorar: HojaPersonaje.#mejorar, xp: HojaPersonaje.#xp,
      nuevaSesion: HojaPersonaje.#nuevaSesion, nuevaAventura: HojaPersonaje.#nuevaAventura, salvacion: HojaPersonaje.#salvacion,
      proezasLibres: HojaPersonaje.#proezasLibres, borrarManual: HojaPersonaje.#borrarManual
    }
  };

  static COMPACTO = { width: 340, height: 760 };
  static PARTS = { hoja: { template: `${RUTA}/templates/hojas/personaje.hbs`, scrollable: [".ys-cuerpo"] } };

  _subtitulo(actor) {
    const d = actor.system.datos;
    return [d.arquetipo, d.profesion, d.edad && `${d.edad} años`].filter(Boolean).map(foundry.utils.escapeHTML).join(" · ");
  }

  async _prepareContext(options) {
    const c = await super._prepareContext(options);
    const a = this.document;
    const s = a.system;
    const ctx = c.ctx;
    const cj = c.cj;
    const ed = ctx.edicion;
    // La barra de Salud llega a 28 (máximo de un PJ) o a su Salud inicial si es mayor.
    const umbralesS = a._umbralesSalud();
    const pasos = Math.max(28, s.salud.max, s.salud.valor);
    const segmentos = Array.from({ length: pasos }, (_, i) => {
      const v = i + 1;
      return {
        v, activo: v <= s.salud.valor, fuera: v > s.salud.max, umbral: umbralesS.includes(v + 1), cruzado: Boolean(s.resistenciaFisica.umbrales[v + 1]),
        etiqueta: v === 10 ? "−1D" : v === 6 ? "−2D" : v === 3 ? "−3D" : "", zona: v <= 3 ? "z3" : v <= 6 ? "z2" : v <= 10 ? "z1" : "z0"
      };
    });
    const umbralesE = ctx.pulp ? R.umbralesPulp(cj.umbralesEstabilidad) : cj.umbralesEstabilidad;
    const pasosE = Math.max(28, s.estabilidad.max, s.estabilidad.valor);
    const estabilidad = Array.from({ length: pasosE }, (_, i) => {
      const v = i + 1;
      return { v, activo: v <= s.estabilidad.valor, fuera: v > s.estabilidad.max, umbral: umbralesE.includes(v + 1), cruzado: Boolean(s.resistenciaMental.umbrales[v + 1]), zona: v <= 3 ? "z3" : v <= 6 ? "z2" : v <= 10 ? "z1" : "z0" };
    });
    const totalProezas = Math.max(s.proezas.valor, s.proezas.inicial);
    const fijos = ["agilidad", "aplomo", "perspicacia"].filter(r => cj.fijos[r]).map(rol => {
      const base = n(s[rol]);
      const efectivo = a.valorFijo(rol);
      const campo = `refuerzo${mayus(rol)}`;
      const chips = [];
      if (rol === "agilidad") {
        if (s.proteccion.agilidad) chips.push(`escudo +${s.proteccion.agilidad}`);
        if (s.combate.defensaCompleta) chips.push(`defensa +${s.combate.defensaCompleta}`);
        if (s.combate.sorprendido) chips.push("sorprendido ½");
        if (s.combate.inmovilizado) chips.push("inmovilizado ½");
      }
      return { rol, etiqueta: cj.fijos[rol], base, valor: efectivo, cambia: efectivo !== base, refuerzo: n(s.combate[campo]) * 3, chips, manual: s.valoresManual?.[rol] !== undefined, ayuda: ayuda("rule", rol, cj) };
    });
    const arma = a.armaEquipada;
    const arquetipos = ARQUETIPOS.map(x => ({ valor: x.name, etiqueta: x.name }));
    return Object.assign(c, {
      segmentos, estabilidadSeg: estabilidad, penalizador: s.penalizadorDados, atributos: this._grupos(a, { poder: true }),
      proezasPips: Array.from({ length: totalProezas }, (_, i) => ({ lleno: i < s.proezas.valor, extra: i >= s.proezas.inicial })),
      fijos, mods: s.efectivos.mods.notas, grupos: this._objetos(a), arquetipos,
      conPanico: s.conPanico, conGuion: ed.puntoGuion && cj.id === "srd", conPoder: Boolean(ctx.poderes), conPulp: ctx.pulp,
      rfPendiente: false, rf: s.rf, rm: s.rm,
      edicionNombre: ed.nombre, tituloProezas: cj.recurso, textoRecuerdo: cj.recuerdo,
      recuerdoUsos: s.recuerdo.usos, recuerdoMax: n(a.fx.recuerdoUsos, 1),
      ataqueActivo: this.#ataqueActivo(a, cj),
      tiposAtaque: Object.entries(cj.ataques).map(([valor, v]) => ({ valor, etiqueta: v.label })),
      coberturas: [["ninguna", "Sin cobertura"], ["parcial", "Hasta el 50 %"], ["fuerte", "Más del 75 %"]].map(([valor, etiqueta]) => ({ valor, etiqueta, activo: s.combate.cobertura === valor })),
      reglas: ctx.opciones, ayuda: { salud: ayuda("rule", "salud"), estabilidad: ayuda("rule", "estabilidad"), proezas: ayuda("rule", "proezas", cj), defectos: ayuda("rule", "defectos"), recuerdo: ayuda("rule", "recuerdo"), guion: ayuda("rule", "puntoGuion"), rf: ayuda("rule", "resistenciaFisica"), rm: ayuda("rule", "resistenciaMental"), iniciativa: ayuda("rule", "iniciativa"), ataque: ayuda("rule", "ataque"), poder: ayuda("rule", "poder"), xp: ayuda("rule", "experiencia") },
      etiquetaRF: cj.rf, etiquetaRM: cj.rm, iniciativa: a.valorIniciativa
    });
  }

  #ataqueActivo(a, cj) {
    const arma = a.armaEquipada;
    const tipo = (arma && cj.ataques[arma.system.tipo] ? arma.system.tipo : null) ?? "desarmado";
    const cfg = cj.ataques[tipo] ?? Object.values(cj.ataques)[0];
    const at = a.system.efectivos.atributos[arma?.system.atributoDano && cj.atributos[arma.system.atributoDano] ? arma.system.atributoDano : cfg.atributo];
    const ed = contexto().edicion;
    const tipoClave = Object.keys(cj.ataques).find(k => cj.ataques[k] === cfg);
    const fijo = R.danoFijo({ edicion: ed, tipo: tipoClave, config: cfg, atributo: at, base: a._danoBaseArma(arma, tipoClave) });
    return { nombre: arma?.name ?? cfg.label, fuente: arma ? "Arma equipada" : "Sin arma equipada", habilidad: cj.habilidades[cfg.habilidad]?.label, daño: fijo, atributo: etiquetaAtributo(cfg.atributo, cj) };
  }

  _tipo(item) { return contexto().conjunto.ataques[item.system.tipo] ? item.system.tipo : item.system.tipo; }

  static #tirarRF() { return this.document.tirarResistencia("fisica"); }
  static #tirarRM() { return this.document.tirarResistencia("mental"); }
  static #proezaMas() { return this.document.ganarProeza(1); }
  static #proezaMenos() { return this.document.gastarProeza(1); }
  static async #premiar() {
    const a = this.document;
    await a.ganarProeza(1);
  }
  static #estabilidadMas() { return this.document.recuperarEstabilidad(1); }
  static #estabilidadMenos() { return this.document.perderEstabilidad(1); }
  static async #estabilidadOtra() {
    const d = await pedirDatos({
      titulo: `Estabilidad · ${this.document.name}`,
      filas: [
        { nombre: "tipo", tipo: "sel", etiqueta: "Qué ocurre", valor: "dano", opciones: [{ valor: "dano", etiqueta: "Pierde Estabilidad" }, { valor: "cura", etiqueta: "Recupera Estabilidad" }] },
        { nombre: "cantidad", tipo: "num", etiqueta: "Puntos", valor: 1, min: 0 }
      ],
      ok: "Aplicar"
    });
    if (!d) return;
    return d.tipo === "dano" ? this.document.perderEstabilidad(d.cantidad) : this.document.recuperarEstabilidad(d.cantidad);
  }
  static #guion() { return this.document.usarPuntoGuion(); }
  static #poderMas() { return this.document.update({ "system.poder.valor": Math.min(n(this.document.system.poder.max), n(this.document.system.poder.valor) + 1) }); }
  static #poderMenos() { return this.document.update({ "system.poder.valor": Math.max(0, n(this.document.system.poder.valor) - 1) }); }
  static #descansar() { return this.document.descansarPoder(); }
  static #arquetipo() { return this.document.aplicarArquetipo(this.element.querySelector("[name='system.datos.arquetipo']")?.value); }
  static #creador() { return abrirCreador(this.document); }
  static #mejorar() { return this.document.mejorar(); }
  static async #xp() {
    const d = await pedirDatos({ titulo: `Experiencia · ${this.document.name}`, filas: [{ nombre: "puntos", tipo: "num", etiqueta: "Puntos de Experiencia", valor: 1, min: 1, max: 9 }, { nombre: "motivo", tipo: "texto", etiqueta: "Motivo", valor: "" }], ok: "Dar" });
    if (d) return this.document.ganarXP(d.puntos, d.motivo);
  }
  static async #nuevaSesion() {
    const r = await this.document.nuevaSesion();
    if (r) ui.notifications.info(`${this.document.name}: nueva sesión${r.sobran ? ` (pierde ${r.sobran} proezas de más)` : ""}${r.extra ? ` (+${r.extra} por Pulp)` : ""}.`);
  }
  static async #nuevaAventura() { await this.document.nuevaAventura(); }
  static #salvacion() { return this.document.salvacionPulp(); }
  static #proezasLibres() { return this.document.update({ "system.proezas.inicial": this.document.system.proezasLibres, "system.proezas.valor": this.document.system.proezasLibres }); }
  static #borrarManual(ev, b) { return this.document.update({ [`system.valoresManual.-=${b.dataset.clave}`]: null }); }
}

/* ---------------------------------------------------------------------- */

export class HojaPnj extends HojaBase {
  static DEFAULT_OPTIONS = {
    classes: ["ys-pnj"],
    position: { width: 560, height: 680 },
    window: { icon: "fa-solid fa-user-secret" },
    actions: { aleatorio: HojaPnj.#aleatorio, saludFija: HojaPnj.#saludFija, referencia: HojaPnj.#referencia, tirarRF: HojaPnj.#tirarRF }
  };

  static COMPACTO = { width: 330, height: 640 };
  static PARTS = { hoja: { template: `${RUTA}/templates/hojas/pnj.hbs`, scrollable: [".ys-cuerpo"] } };

  _subtitulo(actor) { return [actor.system.rol, actor.system.bando].filter(Boolean).map(foundry.utils.escapeHTML).join(" · "); }

  async _prepareContext(options) {
    const c = await super._prepareContext(options);
    const a = this.document;
    const s = a.system;
    const cj = c.cj;
    const pasos = Math.max(28, s.salud.max, s.salud.valor);
    const segmentos = Array.from({ length: pasos }, (_, i) => {
      const v = i + 1;
      return { v, activo: v <= s.salud.valor, fuera: v > s.salud.max, zona: v <= 3 ? "z3" : v <= 6 ? "z2" : v <= 10 ? "z1" : "z0", umbral: cj.umbralesSalud.includes(v + 1), cruzado: Boolean(s.resistenciaFisica.umbrales[v + 1]) };
    });
    const fijos = ["agilidad", "aplomo", "perspicacia"].filter(r => cj.fijos[r]).map(rol => ({
      rol, etiqueta: cj.fijos[rol], valor: a.valorFijo(rol), manual: s[rol].manual, campo: `system.${rol}`, refuerzo: 0, ayuda: ayuda("rule", rol, cj)
    }));
    return Object.assign(c, {
      segmentos, penalizador: s.penalizadorDados, atributos: this._grupos(a), fijos, grupos: this._objetos(a),
      tiposAtaque: Object.entries(cj.ataques).map(([valor, v]) => ({ valor, etiqueta: v.label })),
      habilidadesAtaque: Object.entries(cj.habilidades).map(([valor, v]) => ({ valor, etiqueta: v.label })),
      coberturas: [["ninguna", "Sin cobertura"], ["parcial", "Hasta el 50 %"], ["fuerte", "Más del 75 %"]].map(([valor, etiqueta]) => ({ valor, etiqueta, activo: s.combate.cobertura === valor })),
      mods: s.efectivos.mods.notas, rf: s.rf, etiquetaRF: cj.rf, iniciativa: a.valorIniciativa,
      ayuda: { salud: ayuda("rule", "salud"), rf: ayuda("rule", "resistenciaFisica") }
    });
  }

  static #tirarRF() { return this.document.tirarResistencia("fisica"); }
  static async #aleatorio() { return (await import("./creador.mjs")).pnjAleatorio(this.document); }

  /** Salud sin tirar dado: FUE × 2 + 16 (PNJ poderosos) o + 13 (resto), cap. 5. */
  static async #saludFija() {
    const d = await pedirDatos({ titulo: "Salud rápida", intro: "<p>Sustituye el «+1D» por puntos fijos: 6 para PNJ poderosos y 3 para el resto.</p>", filas: [{ nombre: "poderoso", tipo: "check", etiqueta: "PNJ poderoso (+6)", valor: false }], ok: "Calcular" });
    if (!d) return;
    const v = R.saludFija(this.document.system.efectivos.atributos.fue, d.poderoso);
    return this.document.update({ "system.salud.valor": v, "system.salud.max": v });
  }

  /** Atributos de referencia del anexo del cap. 7 (débil, fuerte, muy fuerte, gran antagonista). */
  static async #referencia() {
    const op = Object.entries(R.REFERENCIAS_PNJ).map(([valor, r]) => ({ valor, etiqueta: r.nota }));
    const d = await pedirDatos({ titulo: "PNJ de referencia", filas: [{ nombre: "ref", tipo: "sel", etiqueta: "Modelo", valor: "fuerte", opciones: op }], ok: "Aplicar" });
    if (!d) return;
    return this.document.update({ "system.atributos": R.REFERENCIAS_PNJ[d.ref].atributos });
  }

  /** Al elegir el tipo de ataque se copian la habilidad del tipo. */
  _onChangeForm(config, event) {
    super._onChangeForm?.(config, event);
    if (event.target?.name === "system.ataque.tipo") {
      const t = contexto().conjunto.ataques[event.target.value];
      if (t) this.document.update({ "system.ataque.nombre": t.label, "system.ataque.habilidad": t.habilidad });
    }
  }
}

/* ---------------------------------------------------------------------- */

export class HojaObjeto extends ConMemoria(HandlebarsApplicationMixin(ItemSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["ysystem3", "ys-hoja", "ys-objeto"],
    position: { width: 480, height: 460 },
    form: { submitOnChange: true },
    window: { resizable: true, icon: "fa-solid fa-suitcase" },
    actions: { usar: HojaObjeto.#usar, chat: HojaObjeto.#chat }
  };

  static PARTS = { hoja: { template: `${RUTA}/templates/hojas/objeto.hbs`, scrollable: [".ys-cuerpo"] } };

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const i = this.document;
    const cj = contexto().conjunto;
    const habOp = Object.entries(cj.habilidades).map(([valor, v]) => ({ valor, etiqueta: v.label }));
    return {
      ...base, item: i, system: i.system, editable: this.isEditable, tipo: i.type, cj, tipoEtiqueta: game.i18n.localize(`TYPES.Item.${i.type}`),
      frecuencias: [["", "Sin renovación"], ["sesion", "Cada sesión"], ["escena", "Cada escena"], ["dia", "Cada día"], ["aventura", "Cada aventura"]].map(([valor, etiqueta]) => ({ valor, etiqueta })),
      tiposAtaque: Object.entries(cj.ataques).map(([valor, v]) => ({ valor, etiqueta: v.label })),
      habilidades: [{ valor: "", etiqueta: "Sin tirada" }, ...habOp, { valor: "magia", etiqueta: "Magia o psiónica" }],
      habilidadesArma: habOp,
      atributosOpc: Object.entries(cj.atributos).map(([valor, v]) => ({ valor, etiqueta: `${v.label} (${v.short})` })),
      contraOpc: [{ valor: "", etiqueta: "Sin oposición" }, ...["agilidad", "aplomo", "perspicacia"].filter(r => cj.fijos[r]).map(r => ({ valor: r, etiqueta: cj.fijos[r] }))],
      dificultadesPoder: [8, 12, 16].map(valor => ({ valor, etiqueta: `${valor} · cuesta ${R.COSTE_PODER[valor]} de Poder` })),
      esArma: i.type === "arma", esProteccion: i.type === "armadura" || i.type === "escudo", esPoder: i.type === "poder", esTalento: i.type === "talento",
      esArquetipo: i.type === "arquetipo", esEquipo: i.type === "equipo" || i.type === "objeto",
      penalizacion: i.type === "armadura" ? R.penalizacionArmadura(i.system.nivel) : R.penalizacionEscudo(i.system.nivel)
    };
  }

  static #usar() { return this.document.usar(); }
  static #chat() { return this.document.mostrarEnChat(); }
}
