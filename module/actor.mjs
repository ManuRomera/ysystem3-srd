/**
 * Actor de Ysystem3 (personajes y PNJ). Los cálculos están en reglas.mjs; las tarjetas con estado, en flujos.mjs.
 * Todo lo que cambia con la ambientación (conjunto de reglas, edición, reglas opcionales) llega por `contexto()`.
 */
import { ID, CLAVES_ATRIBUTO, CLAVES_HABILIDAD, etiquetaHabilidad, etiquetaAtributo, tipoAtaque } from "./config.mjs";
import * as R from "./reglas.mjs";
import { contexto } from "./ajustes.mjs";
import { efectosDe, aplica, clave as claveTalento } from "./talentos.mjs";
import { lanzar, publicarEfecto, publicarUmbrales, publicarPersecucion, mostrar } from "./flujos.mjs";
import { publicar } from "./chat.mjs";
import { pedirDatos, confirmar } from "./dialogos.mjs";
import { arquetipoByKey, archetypeSystem, archetypeTalentItem } from "./arquetipos-data.mjs";

const esc = foundry.utils.escapeHTML;
const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const dado = x => Math.min(3, Math.max(1, n(x, 1)));
const objetivoActual = () => game.user.targets.first() ?? null;
const sig = v => (v > 0 ? `+${v}` : `${v}`);

export class ActorYsystem3 extends Actor {
  get esPJ() { return this.type === "personaje"; }
  get ctx() { return contexto(); }

  /** Efectos de los talentos del actor (se recalcula con los datos derivados). */
  get fx() { return (this._fx ??= efectosDe(this)); }

  /* ---------------- Datos derivados ---------------- */

  prepareDerivedData() {
    super.prepareDerivedData();
    this._fx = null;
    const s = this.system;
    const ctx = contexto();
    const cj = ctx.conjunto;
    const ef = this._efectivos();
    s.efectivos = ef;
    s.salud.value = s.salud.valor;        // las barras de token leen `value`; la escritura pasa por modifyTokenAttribute
    if (this.esPJ) s.estabilidad.value = s.estabilidad.valor;
    const a = ef.atributos;
    const dAtl = ef.habilidades.atletismo.dados;
    s.proteccion = { dano: ef.mods.proteccionDano, agilidad: ef.mods.proteccionAgilidad, penalizacion: ef.mods.penalizacion };
    s.penalizadorDados = s.combate?.ignoraPenalizador ? 0 : R.penalizadorSalud(s.salud.valor);
    s.conPanico = cj.tienePanico && this.esPJ;

    const autoAgi = R.agilidad(dAtl, a.des);
    const autoApl = cj.id === "srd" ? R.aplomo(a.car, a.int) : R.bemoles(a.int);
    const autoPer = cj.fijos.perspicacia ? R.perspicacia(a.int, a.per) : "";
    if (this.esPJ) {
      const m = s.valoresManual ?? {};
      const manual = (v, auto) => (v === undefined || v === null || v === "" ? auto : n(v, auto));
      s.agilidad = manual(m.agilidad, autoAgi);
      s.aplomo = manual(m.aplomo, autoApl);
      s.perspicacia = autoPer === "" ? "" : manual(m.perspicacia, autoPer);
      s.rf = manual(m.resistenciaFisica, R.resistenciaFisica(a.fue));
      s.rm = manual(m.resistenciaMental, R.resistenciaMental(a.car));
      s.proezasLibres = R.proezasIniciales(a.fue, a.int, cj.id === "srd" ? 3 : 2);
      s.reparto = R.repartoLibre(s._source.atributos, s._source.habilidades, cj);
      s.penalizadorPoder = ctx.poderes && s.poder.valor <= 0 ? 1 : 0;
      s.poderLibre = R.poderInicial(s.poder.dados, a.int, a.per);
      s.xpDisponible = n(s.experiencia.total) - n(s.experiencia.gastada);
      s.salvacionPulp = ctx.pulp && !s.pulp.salvacionUsada;
    } else {
      if (!s.agilidad.manual) s.agilidad.valor = autoAgi;
      if (!s.aplomo.manual) s.aplomo.valor = autoApl;
      if (!s.perspicacia.manual) s.perspicacia.valor = autoPer === "" ? 0 : autoPer;
      if (!s.resistenciaFisica.manual) s.resistenciaFisica.valor = R.resistenciaFisica(a.fue);
      s.rf = s.resistenciaFisica.valor;
    }
  }

  /** Atributos, dados de habilidad y protecciones tras el equipo. */
  _efectivos() {
    const s = this.system;
    const ed = contexto().edicion;
    const atributos = Object.fromEntries(CLAVES_ATRIBUTO.map(k => [k, n(s.atributos[k])]));
    const habilidades = Object.fromEntries(CLAVES_HABILIDAD.map(k => [k, { dados: dado(s.habilidades[k]?.dados) }]));
    const mods = { proteccionDano: 0, proteccionAgilidad: 0, penalizacion: 0, notas: [] };
    for (const item of this.items ?? []) {
      if (!item.system?.equipado) continue;
      const nivel = Math.max(0, n(item.system.nivel));
      if (item.type === "armadura") {
        mods.proteccionDano += nivel; mods.penalizacion += R.penalizacionArmadura(nivel);
        mods.notas.push(`${item.name}: −${nivel} al daño, −${R.penalizacionArmadura(nivel)} a ${ed.protecciones === "todas" ? "todas las habilidades" : "DES y FUE"}`);
      } else if (item.type === "escudo") {
        mods.proteccionAgilidad += nivel; mods.penalizacion += R.penalizacionEscudo(nivel);
        mods.notas.push(`${item.name}: +${nivel} a la Agilidad, −${R.penalizacionEscudo(nivel)} a ${ed.protecciones === "todas" ? "todas las habilidades" : "DES y FUE"}`);
      }
    }
    return { atributos, habilidades, mods };
  }

  /**
   * Valor fijo efectivo en este momento: protecciones, refuerzos con proezas, defensa completa,
   * cobertura (solo frente a ataques a distancia), sorpresa e inmovilización.
   */
  valorFijo(rol, { distancia = false, rafagaBlancos = 0 } = {}) {
    const s = this.system;
    const base = this.esPJ ? n(s[rol]) : n(s[rol]?.valor);
    const c = s.combate ?? {};
    const refuerzo = n(c[`refuerzo${rol[0].toUpperCase()}${rol.slice(1)}`]);
    if (rol !== "agilidad") return base + R.refuerzoFijo(refuerzo);
    return R.agilidadEfectiva({
      base, escudo: n(s.proteccion?.agilidad), refuerzos: refuerzo, defensa: n(c.defensaCompleta),
      cobertura: distancia ? R.bonoCobertura(c.cobertura, c.resguardado) : 0, rafagaBlancos,
      edicion: contexto().edicion, sorprendido: Boolean(c.sorprendido), inmovilizado: Boolean(c.inmovilizado)
    });
  }

  tieneTalento(nombre) { return this.fx.nombres.includes(claveTalento(nombre)); }

  /* ---------------- Proezas ---------------- */

  puedeGastarProeza(cantidad = 1, { aviso = true } = {}) {
    if (!this.esPJ) return true;
    const tiene = n(this.system.proezas.valor);
    if (tiene >= cantidad) return true;
    if (aviso) ui.notifications.warn(`${this.name} no tiene ${contexto().conjunto.recurso.toLowerCase()} suficientes (${tiene}/${cantidad}).`);
    return false;
  }

  async gastarProeza(cantidad = 1, { silencioso = false } = {}) {
    if (!this.esPJ || cantidad <= 0) return true;
    if (!this.puedeGastarProeza(cantidad)) return false;
    const antes = n(this.system.proezas.valor);
    await this.update({ "system.proezas.valor": antes - cantidad });
    if (!silencioso) await this._avisoProezas("gasta", cantidad, antes, antes - cantidad);
    return true;
  }

  async ganarProeza(cantidad = 1, { silencioso = false } = {}) {
    if (!this.esPJ || cantidad <= 0) return;
    const antes = n(this.system.proezas.valor);
    await this.update({ "system.proezas.valor": antes + cantidad });
    if (!silencioso) await this._avisoProezas("gana", cantidad, antes, antes + cantidad);
  }

  _avisoProezas(verbo, cantidad, antes, despues) {
    const cj = contexto().conjunto;
    return publicar({ tono: verbo === "gana" ? "exito" : "aviso", icono: "fa-solid fa-star", etiqueta: cj.recurso, titulo: `${antes} → ${despues}`, texto: `${this.name} ${verbo} ${cantidad} ${cantidad > 1 ? cj.recurso.toLowerCase() : cj.recursoUno}.` }, { actor: this });
  }

  /** Gastar proezas para sumar +3 a Agilidad, Aplomo o Perspicacia durante un turno completo (cap. 3). */
  async reforzar(rol) {
    if (!this.esPJ) return null;
    const cj = contexto().conjunto;
    const nombre = cj.fijos[rol];
    const datos = await pedirDatos({
      titulo: `Reforzar ${nombre}: ${this.name}`,
      intro: `<p>Cada ${cj.recursoUno} suma +3 durante un turno completo, sin límite. Se declara antes de la tirada.</p>`,
      filas: [{ nombre: "puntos", tipo: "num", etiqueta: `${cj.recurso} (tiene ${this.system.proezas.valor})`, valor: 1, min: 1 }],
      ok: "Gastar"
    });
    const puntos = n(datos?.puntos);
    if (puntos < 1 || !(await this.gastarProeza(puntos, { silencioso: true }))) return null;
    const campo = `system.combate.refuerzo${rol[0].toUpperCase()}${rol.slice(1)}`;
    await this.update({ [campo]: n(foundry.utils.getProperty(this, campo)) + puntos });
    await publicar({ tono: "aviso", icono: "fa-solid fa-star", etiqueta: cj.recurso, titulo: `+${R.refuerzoFijo(puntos)} a ${nombre}`, texto: `${this.name} gasta ${puntos} ${puntos > 1 ? cj.recurso.toLowerCase() : cj.recursoUno}: ${nombre} ${this.valorFijo(rol)} durante el turno.` }, { actor: this });
    return puntos;
  }

  /* ---------------- Tiradas de habilidad ---------------- */

  /**
   * Tirada de habilidad. Sin `datos` abre el diálogo; con `datos` las opciones ya vienen dadas
   * (ataques, defensa, persecución). Devuelve {mensaje, estado, resultado} o null si se cancela.
   */
  async tirarHabilidad(clave, { dificultad, dialogo = true, datos = null, notas = [], ataque = null, atributoPoder = "" } = {}) {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const etiqueta = k => (k === "magia" ? (ctx.poderes === "psionica" ? "Psiónica" : "Magia") : etiquetaHabilidad(k, cj));
    const hab = cj.habilidades[clave] ?? (clave === "magia" ? { label: etiqueta("magia"), atributo: atributoPoder, oposicion: "" } : null);
    if (!hab) return ui.notifications.warn(`La habilidad «${clave}» no existe en esta ambientación.`) && null;
    const s = this.system;
    const ef = s.efectivos;
    const fx = this.fx;
    const ed = ctx.edicion;
    if (clave === "idiomaExtranjero2" && cj.id === "srd" && !R.idiomaDisponible(ef.habilidades.idiomaExtranjero1.dados, clave)) {
      return ui.notifications.warn("No se puede usar el segundo idioma sin 2D o 3D en el primero.") && null;
    }
    const objetivo = objetivoActual()?.actor;
    let porDefecto = dificultad;
    let ayuda = "";
    if (porDefecto == null) {
      porDefecto = cj.dificultadBase;
      if (objetivo && hab.oposicion && cj.fijos[hab.oposicion]) {
        porDefecto = objetivo.valorFijo(hab.oposicion);
        ayuda = `${objetivo.name}: ${cj.fijos[hab.oposicion]} ${porDefecto}`;
      }
    }
    const pj = this.esPJ;
    const pen = n(s.penalizadorDados);
    const baseDados = clave === "magia" ? n(s.poder.dados) : ef.habilidades[clave]?.dados ?? 1;
    const atributoBase = hab.atributo ? n(ef.atributos[hab.atributo]) : 0;
    const dobla = fx.atributoDoble && fx.atributoDoble.atributo === hab.atributo && fx.atributoDoble.habilidades.includes(clave);
    const atributo = dobla ? atributoBase * 2 : atributoBase;
    const penProt = hab.atributo && clave !== "magia" && R.penalizaHabilidad(hab.atributo, ed) ? n(s.proteccion.penalizacion) : 0;
    const profesionOk = pj || ed.profesionPNJ;
    const recuerdoMax = n(fx.recuerdoUsos, 1);
    const recuerdoLibre = pj && n(s.recuerdo.usos) < recuerdoMax;
    const oscuridadPosible = R.modificadorOscuridad(clave, ed) !== 0;

    let d = datos;
    if (!d && dialogo) {
      const resumen = `${baseDados}D6 ${sig(atributo)} (${etiquetaAtributo(hab.atributo, cj) || "sin atributo"})`;
      d = await pedirDatos({
        titulo: `${etiqueta(clave)} · ${this.name}`,
        intro: `<p>${resumen}${pen ? ` · <b>−${pen}D por Salud</b>` : ""}${penProt ? ` · <b>−${penProt} por protecciones</b>` : ""}</p>`,
        filas: [
          { nombre: "dificultad", tipo: "num", etiqueta: "Dificultad", valor: porDefecto, min: 1, max: 40, ayuda },
          ...(oscuridadPosible ? [{ nombre: "oscuridad", tipo: "check", etiqueta: `Sin luz (${sig(R.modificadorOscuridad(clave, ed))} a la dificultad)`, valor: false }] : []),
          ...(profesionOk ? [{ nombre: "profesion", tipo: "check", etiqueta: `${cj.profesion}: la acción encaja (+3)`, valor: false }] : []),
          ...(pj ? [
            { nombre: "proeza", tipo: "check", etiqueta: `Gastar 1 ${cj.recursoUno} antes de tirar: +1D${fx.proezaDoble && aplica(fx.proezaDoble, clave) ? " (+2D con tu talento)" : ""}`, valor: false, desactivado: s.proezas.valor < 1 },
            { nombre: "recuerdo", tipo: "check", etiqueta: `${cj.recuerdo}: +2D${recuerdoMax > 1 ? ` (${recuerdoMax - n(s.recuerdo.usos)} libres)` : ""}`, valor: false, desactivado: !recuerdoLibre, ayuda: "No se combina con el +1D de una proeza en la misma tirada." }
          ] : []),
          ...(fx.dadoOpcional ? [{ nombre: "opcional", tipo: "check", etiqueta: fx.dadoOpcional.etiqueta, valor: false }] : []),
          { nombre: "colaboradores", tipo: "num", etiqueta: "Colaboradores en acción combinada (+2 c/u, máx. +10)", valor: 0, min: 0, max: 9 },
          { nombre: "recibidos", tipo: "num", etiqueta: "Dados recibidos por ayuda (+1D c/u)", valor: 0, min: 0, max: 5 },
          { nombre: "prestados", tipo: "num", etiqueta: "Dados que cedo para ayudar (−1D c/u)", valor: 0, min: 0, max: 3, desactivado: !pj },
          { nombre: "bonus", tipo: "num", etiqueta: "Modificador fijo", valor: 0, min: -20, max: 20 }
        ],
        ok: "Tirar"
      });
    }
    if (!d) return null;
    d = { dificultad: porDefecto, ...d };
    if (d.proeza && d.recuerdo) return ui.notifications.warn("El Recuerdo cuando… no se combina con el +1D de una proeza en la misma tirada.") && null;
    if (pj && d.proeza && !(await this.gastarProeza(1, { silencioso: true }))) return null;
    if (pj && d.recuerdo) await this.update({ "system.recuerdo.usos": n(s.recuerdo.usos) + 1, "system.recuerdo.usado": n(s.recuerdo.usos) + 1 >= recuerdoMax });

    const lista = [...notas];
    const extra = (fx.dadoFijo?.habilidades?.includes(clave) ? 1 : 0) + (d.opcional ? 1 : 0)
      + (d.proeza && fx.proezaDoble && aplica(fx.proezaDoble, clave) ? 1 : 0) - (d.menos ? n(d.menos) : 0);
    const colab = R.combinadas(d.colaboradores, fx.combinadas);
    const bonus = n(d.bonus) + (d.profesion ? 3 : 0) + colab - penProt + (d.proeza && fx.proezaMas2 ? 2 : 0) + n(d.bonoExtra);
    if (d.profesion) lista.push(`${cj.profesion} +3`);
    if (d.proeza) lista.push(`${cj.recursoUno[0].toUpperCase()}${cj.recursoUno.slice(1)}: +1D${fx.proezaDoble && aplica(fx.proezaDoble, clave) ? " extra por talento" : ""}`);
    if (d.recuerdo) lista.push(`${cj.recuerdo}: +2D`);
    if (d.opcional) lista.push(`${fx.dadoOpcional.etiqueta.split(":")[0]}: +1D`);
    if (colab) lista.push(`Acción combinada: +${colab}`);
    if (n(d.recibidos)) lista.push(`Ayuda recibida: +${d.recibidos}D`);
    if (n(d.prestados)) lista.push(`Ayuda prestada: −${d.prestados}D`);
    if (n(d.sacrificados)) lista.push(`Apunta: sacrifica ${d.sacrificados}D`);
    if (pen) lista.push(`−${pen}D por Salud`);
    if (penProt) lista.push(`−${penProt} por protecciones`);
    if (dobla) lista.push("Bonificador doble por talento");
    if (d.proeza && fx.proezaMas2) lista.push("«Dejadme hacerlo a mí»: +2");
    let difFinal = n(d.dificultad, porDefecto);
    if (d.oscuridad) { const m = R.modificadorOscuridad(clave, ed); difFinal += m; lista.push(`Sin luz: ${sig(m)} a la dificultad`); }

    const dados = R.dadosDeTirada({
      base: baseDados, extra, proeza: Boolean(d.proeza), recuerdo: Boolean(d.recuerdo), recibidos: n(d.recibidos),
      sacrificados: n(d.sacrificados), penalizador: pen, prestados: n(d.prestados), tope: ed.topeDados
    });
    if (Number.isFinite(ed.topeDados) && baseDados + extra + (d.proeza ? 1 : 0) + (d.recuerdo ? 2 : 0) + n(d.recibidos) - pen > ed.topeDados) lista.push(`Tope de ${ed.topeDados}D`);

    const resultado = await lanzar({
      actor: this, token: this.token?.object, clave, etiqueta: etiqueta(clave), dados, atributo, bonus, dificultad: difFinal,
      flavor: `${etiqueta(clave)} (${etiquetaAtributo(hab.atributo, cj) || "sin atributo"})`, notas: lista, ataque, opciones: { dadoProeza: Boolean(d.proeza) }
    });
    // «La experiencia es un grado»: un Recuerdo con éxito se conserva.
    if (pj && d.recuerdo && fx.recuerdoRepite && resultado.resultado.exito) {
      await this.update({ "system.recuerdo.usos": Math.max(0, n(this.system.recuerdo.usos) - 1), "system.recuerdo.usado": false });
    }
    return resultado;
  }

  /* ---------------- Resistencias (caps. 5 y 6) ---------------- */

  /** Tirada de Resistencia física o mental: 3D sin atributo contra el valor del personaje. */
  async tirarResistencia(tipo, { motivo = "", umbral = false, perdida = 0, dadosMenos = 0, dialogo = true } = {}) {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const fisica = tipo === "fisica";
    if (!fisica && !cj.tienePanico) return ui.notifications.warn("Esta ambientación no tiene Resistencia mental.") && null;
    if (!fisica && !this.esPJ) return null;
    const s = this.system;
    const fx = this.fx;
    const nombre = fisica ? cj.rf : cj.rm;
    const valor = fisica ? n(s.rf) : n(s.rm);
    const hasta = ctx.opciones.panicoAmpliado && !fisica;
    const pen = fisica ? n(s.penalizadorDados) : hasta ? R.penalizadorSalud(s.estabilidad.valor) : 0;
    const tipoRoll = fisica ? "resistenciaFisica" : "resistenciaMental";
    const proezaPermitida = this.esPJ && (ctx.pulp || fx.resistenciaProeza);
    const fijo = fx.dadoFijo?.resistencias?.includes(tipo === "fisica" ? "fisica" : "mental") ? 1 : 0;
    const recuerdoMax = n(fx.recuerdoUsos, 1);
    const recuerdoLibre = this.esPJ && n(s.recuerdo.usos) < recuerdoMax;
    let d = { dificultad: valor, recuerdo: false, proeza: false };
    if (dialogo) {
      d = await pedirDatos({
        titulo: `${nombre} · ${this.name}`,
        intro: `<p>3D6 contra el valor de ${esc(nombre)}${pen ? ` · <b>−${pen}D</b>` : ""}${fisica ? "" : " · sin penalizador de Salud"}. ${fisica ? "Si falla, cae inconsciente." : "Si falla, sufre una crisis de locura temporal."}${motivo ? ` (${esc(motivo)})` : ""}</p>`,
        filas: [
          { nombre: "dificultad", tipo: "num", etiqueta: `Valor de ${nombre}`, valor, min: 1, max: 30 },
          ...(this.esPJ ? [{ nombre: "recuerdo", tipo: "check", etiqueta: `${cj.recuerdo}: +2D`, valor: false, desactivado: !recuerdoLibre }] : []),
          ...(proezaPermitida ? [{ nombre: "proeza", tipo: "check", etiqueta: `Gastar 1 ${cj.recursoUno} antes de tirar: +1D (${ctx.pulp ? "Anexo Pulp" : "Duro de pelar"})`, valor: false, desactivado: s.proezas.valor < 1 }] : [])
        ],
        ok: "Tirar"
      });
      if (!d) return null;
    }
    if (d.proeza && !(await this.gastarProeza(1, { silencioso: true }))) return null;
    if (d.recuerdo) await this.update({ "system.recuerdo.usos": n(s.recuerdo.usos) + 1, "system.recuerdo.usado": n(s.recuerdo.usos) + 1 >= recuerdoMax });
    const notas = [];
    if (d.recuerdo) notas.push(`${cj.recuerdo}: +2D`);
    if (d.proeza) notas.push(`${cj.recursoUno}: +1D`);
    if (fijo) notas.push("Talento: +1D");
    if (dadosMenos) notas.push(`−${dadosMenos}D (${motivo || "efecto"})`);
    if (pen) notas.push(`−${pen}D por ${fisica ? "Salud" : "Estabilidad"}`);
    if (umbral) notas.push(`Umbral de ${fisica ? "Salud" : "Estabilidad"}`);
    const dados = R.dadosDeTirada({ base: 3, extra: fijo - dadosMenos, proeza: Boolean(d.proeza), recuerdo: Boolean(d.recuerdo), penalizador: pen, tope: ctx.edicion.topeDados });
    return lanzar({
      actor: this, token: this.token?.object, etiqueta: nombre, dados, atributo: 0, bonus: 0, dificultad: n(d.dificultad, valor), tipo: tipoRoll,
      flavor: motivo || "3D6 contra el valor", notas, umbral, perdida, opciones: { dadoProeza: false }
    });
  }

  /* ---------------- Iniciativa ---------------- */

  get armaEquipada() { return this.items.find(i => i.type === "arma" && i.system.equipado) ?? null; }

  /** Bonificador de iniciativa por arma (solo YayoSystem de IMSERSO). */
  bonoIniciativaArma() {
    const cj = contexto().conjunto;
    if (!cj.iniciativaArma) return 0;
    const arma = this.armaEquipada;
    const tipo = tipoAtaque(arma?.system.tipo ?? this.system.combate?.armaIniciativa ?? this.system.ataque?.tipo ?? "sinArmas", cj);
    return n(arma ? arma.system.iniciativa : 0, cj.ataques[tipo]?.iniciativa ?? 0) || (cj.ataques[tipo]?.iniciativa ?? 0);
  }

  /** Valor de iniciativa de este personaje: DES + INT (YayoSystem: PRE + arma). */
  get valorIniciativa() {
    const a = this.system.efectivos.atributos;
    const cj = contexto().conjunto;
    return cj.id === "srd" ? R.iniciativa(a.des, a.int) : a.des + this.bonoIniciativaArma();
  }

  /* ---------------- Ataque (cap. 5) ---------------- */

  /** Daño base a usar para una ficha de arma: la tabla de la edición salvo que el arma lo fije a mano. */
  _danoBaseArma(arma, tipo) {
    if (!arma) return null;
    const v = n(arma.system.danoBase, null);
    if (v === null || v === 0) return null;
    const y3 = R.EDICIONES.y3.dano[tipo], er = R.EDICIONES.er.dano[tipo];
    return v === y3 || v === er ? null : v;
  }

  async atacar({ item = null } = {}) {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const ed = ctx.edicion;
    const fx = this.fx;
    const marcas = [...game.user.targets];
    const marca = marcas[0] ?? null;
    const objetivo = marca?.actor ?? null;
    const arma = item ?? this.armaEquipada;
    const tipoInicial = tipoAtaque(arma?.system.tipo ?? (this.esPJ ? this.system.combate.ataque : this.system.ataque.tipo), cj);
    const cfgInicial = cj.ataques[tipoInicial];
    const opcionesTipo = Object.entries(cj.ataques).map(([valor, v]) => ({ valor, etiqueta: v.label }));
    const rolFijo = cj.fijos.agilidad;
    const agilObj = objetivo ? objetivo.valorFijo("agilidad", { distancia: Boolean(cfgInicial?.distancia) }) : 9;
    const pj = this.esPJ;
    const maxPZ = cfgInicial?.maxProezas ?? 2;
    const intro = `<p>${objetivo ? `Objetivo: <strong>${esc(objetivo.name)}</strong> (${esc(rolFijo)} ${agilObj}${objetivo.system.combate?.sorprendido ? ", sorprendido" : ""}${objetivo.system.combate?.inmovilizado ? ", inmovilizado" : ""}).` : "Sin objetivo marcado: se resuelve a mano."}${arma ? ` Arma: <strong>${esc(arma.name)}</strong>.` : ""}${marcas.length > 1 ? ` Hay ${marcas.length} objetivos marcados (ráfaga con armas automáticas).` : ""}</p>`;
    const d = await pedirDatos({
      titulo: `Ataque · ${this.name}`, intro,
      filas: [
        { nombre: "tipo", tipo: "sel", etiqueta: "Tipo de ataque", valor: tipoInicial, opciones: opcionesTipo },
        ...(objetivo ? [] : [{ nombre: "nombreObjetivo", tipo: "texto", etiqueta: "Nombre del objetivo", valor: "Objetivo" }]),
        { nombre: "dificultad", tipo: "num", etiqueta: `${rolFijo} del objetivo`, valor: agilObj, min: 1, max: 60 },
        ...(objetivo ? [] : [{ nombre: "armadura", tipo: "num", etiqueta: "Armadura del objetivo", valor: 0, min: 0, max: 20 }]),
        { nombre: "sacrificados", tipo: "num", etiqueta: "Dados que sacrifica para apuntar", valor: 0, min: 0, max: 3, ayuda: "Cada dado: +1D6 de daño cuerpo a cuerpo, +2D6 a distancia (no explotan)" },
        ...(ctx.opciones.noquear ? [{ nombre: "noquear", tipo: "check", etiqueta: "Noquear (solo cuerpo a cuerpo): apunta con 1D, daño a la mitad y Resistencia física con 1D menos", valor: false }] : []),
        { nombre: "desenfundar", tipo: "check", etiqueta: "Desenfunda o cambia de arma en este turno (−1D)", valor: false },
        ...(pj ? [
          { nombre: "proezasDano", tipo: "num", etiqueta: `${cj.recurso} al daño (máx. ${maxPZ}, 1D explosivo cada una)`, valor: 0, min: 0, max: 3 },
          { nombre: "proeza", tipo: "check", etiqueta: `Gastar 1 ${cj.recursoUno}: +1D a impactar`, valor: false }
        ] : []),
        { nombre: "profesion", tipo: "check", etiqueta: `${cj.profesion} (+3)`, valor: false },
        { nombre: "colaboradores", tipo: "num", etiqueta: "Colaboradores en un ataque combinado (+2 cada uno, máx. 5)", valor: 0, min: 0, max: 5 },
        ...(fx.primerTurnoDano ? [{ nombre: "primerTurno", tipo: "check", etiqueta: "Primer turno del combate y actúas antes: 1D extra de daño (talento)", valor: false }] : []),
        { nombre: "oscuridad", tipo: "check", etiqueta: "Sin luz (+5 a la dificultad)", valor: false }
      ],
      ok: "Atacar"
    });
    if (!d) return null;
    const tipo = d.tipo;
    const cfg = cj.ataques[tipo];
    if (d.noquear && cfg.distancia) return ui.notifications.warn("No se puede noquear con armas a distancia.") && null;
    const habilidad = arma?.system.habilidad && cj.habilidades[arma.system.habilidad] ? arma.system.habilidad : cfg.habilidad;
    const atrDano = cfg.atributo;
    const atrValor = n(this.system.efectivos.atributos[arma?.system.atributoDano && cj.atributos[arma.system.atributoDano] ? arma.system.atributoDano : atrDano]);
    const base = this._danoBaseArma(arma, tipo) ?? (fx.danoFuego?.[tipo] ?? null);
    const propio = !arma && !pj ? this.system.ataque : null;
    const baseFinal = propio && n(propio.dano, 0) ? n(propio.dano) : base;
    const fijo = R.danoFijo({ edicion: ed, tipo, config: cfg, atributo: atrValor, base: baseFinal });
    const rafaga = Boolean(cfg.auto) && marcas.length > 1;
    const blancos = rafaga ? marcas.slice(0, ed.rafaga.maxBlancos) : [marca];
    if (rafaga && marcas.length > ed.rafaga.maxBlancos) ui.notifications.warn(`Una ráfaga alcanza como máximo a ${ed.rafaga.maxBlancos} blancos.`);

    const proezasDano = pj ? R.topeProezasDano(d.proezasDano, maxPZ) : 0;
    const gasto = proezasDano + (d.proeza ? 1 : 0);
    if (gasto && !this.puedeGastarProeza(gasto)) return null;
    const sacrificados = n(d.sacrificados) + (d.noquear ? 1 : 0);
    const porDado = (cfg.apuntar ?? 1) * (fx.apuntar?.mult && cfg.distancia ? fx.apuntar.mult / (cfg.apuntar ?? 1) : 1);
    const dadosApuntar = d.noquear ? Math.max(0, n(d.sacrificados)) * (cfg.apuntar ?? 1) : R.dadosApuntar(sacrificados, porDado);
    const rafagaBlancos = rafaga ? blancos.length : 0;
    const resultados = [];
    let primero = true;
    for (const t of blancos) {
      const obj = t?.actor ?? null;
      const dificultad = rafaga ? obj.valorFijo("agilidad", { distancia: true, rafagaBlancos }) : n(d.dificultad, agilObj);
      const fuego = Boolean(cfg.fuego);
      const ataque = {
        etiqueta: arma?.name ?? propio?.nombre ?? cfg.label, tipo, habilidad, fijo, formulaFijo: `(${cj.atributos[atrDano]?.short ?? atrDano} ${atrValor})`,
        dadosApuntar, proezasDano: primero ? proezasDano : 0, explotaCon: fx.explotaCon ?? 6,
        dadoExtra: (fx.danoExtraDado?.includes(tipo) ? 1 : 0) + (fx.primerTurnoDano && d.primerTurno ? 1 : 0),
        objetivoUuid: obj?.uuid ?? "", tokenUuid: t?.document?.uuid ?? "", objetivoNombre: obj?.name ?? d.nombreObjetivo ?? "Objetivo",
        valor: rolFijo, fuego, noquear: Boolean(d.noquear), armadura: obj ? undefined : n(d.armadura),
        dobla: cj.id === "srd" ? "fijo" : "todo"
      };
      if (cj.defensaActiva && obj) {
        ataque.defensa = { dificultad: R.dificultadDefensa({ conjunto: cj.id, fuego, distancia: Boolean(cfg.distancia), apuntado: sacrificados > 0, escudo: obj.items.some(i => i.type === "escudo" && i.system.equipado) }) };
      }
      const bonoExtra = (fx.apuntar?.mas3 && sacrificados > 0 ? 3 : 0);
      const res = await this.tirarHabilidad(habilidad, {
        dificultad, ataque, dialogo: false,
        datos: {
          dificultad, profesion: d.profesion, proeza: primero && d.proeza, colaboradores: d.colaboradores, sacrificados,
          menos: d.desenfundar ? 1 : 0, oscuridad: d.oscuridad, bonoExtra
        },
        notas: [
          ...(proezasDano && primero ? [`${proezasDano} ${proezasDano > 1 ? cj.recurso.toLowerCase() : cj.recursoUno} al daño`] : []),
          ...(rafaga ? [`Ráfaga a ${blancos.length} blancos: +${blancos.length * ed.rafaga.porBlanco} a su ${rolFijo}`] : []),
          ...(d.desenfundar ? ["Desenfunda o cambia de arma: −1D"] : []),
          ...(d.noquear ? ["Noquear"] : [])
        ]
      });
      if (!res) return null;
      resultados.push(res);
      primero = false;
    }
    if (rafaga) {
      const roll = await new Roll("1d6").evaluate();
      await mostrar(roll);
      const vacia = R.rafagaVacia(roll.total, ed);
      await publicar({
        tono: vacia ? "pifia" : "aviso", icono: "fa-solid fa-gun", etiqueta: "Ráfaga", subtitulo: this.name, resultado: vacia ? "Cargador vacío" : "Aún queda munición",
        lineas: [{ texto: `1D = ${roll.total}: ${vacia ? `con 1${ed.rafaga.vaciaCon > 1 ? " o 2" : ""} el cargador se vacía y recargar ocupa todo el turno siguiente.` : "el cargador aguanta."}` }]
      }, { actor: this, rolls: [roll] });
    }
    return resultados[0];
  }

  /* ---------------- Acciones de combate (cap. 5) ---------------- */

  /** Defenderse completamente: +1D a la Agilidad este turno y sube una posición en la iniciativa. */
  async defensaCompleta() {
    const roll = await new Roll("1d6").evaluate();
    await mostrar(roll);
    await this.update({ "system.combate.defensaCompleta": roll.total });
    await publicar({
      tono: "aviso", icono: "fa-solid fa-shield-halved", etiqueta: "Defensa completa", titulo: `+${roll.total} a la Agilidad`,
      texto: `${this.name} renuncia a atacar: 1D = ${roll.total} (Agilidad ${this.valorFijo("agilidad")}) y asciende una posición en el orden de iniciativa a partir del turno siguiente. Las proezas se pueden gastar además.`
    }, { actor: this, rolls: [roll] });
    const c = game.combat?.combatants.find(x => x.actorId === this.id);
    if (c) await c.setFlag(ID, "asciende", true);
  }

  /** Inmovilizar: Lucha contra la Agilidad del oponente + 3. */
  async inmovilizar() {
    const marca = objetivoActual();
    const objetivo = marca?.actor;
    if (!objetivo) return ui.notifications.warn("Marca como objetivo al personaje que quieres inmovilizar.");
    const res = await this.tirarHabilidad("lucha", { dificultad: objetivo.valorFijo("agilidad") + 3, notas: ["Inmovilizar: Agilidad del oponente + 3"] });
    if (res?.resultado.exito) {
      await objetivo.update({ "system.combate.inmovilizado": true });
      await publicar({ tono: "exito", icono: "fa-solid fa-hand", etiqueta: "Inmovilizado", titulo: objetivo.name, texto: `${objetivo.name} tiene la mitad de Agilidad (${objetivo.valorFijo("agilidad")}) y solo puede intentar zafarse. Se le puede desplazar 1 metro por turno.` }, { actor: this });
    }
    return res;
  }

  /** Zafarse: Fuerza bruta contra la Agilidad del agarrador + 3. */
  async zafarse() {
    const marca = objetivoActual();
    const rival = marca?.actor;
    const dif = rival ? rival.valorFijo("agilidad") + 3 : 12;
    const clave = contexto().conjunto.habilidades.fuerzaBruta ? "fuerzaBruta" : "mulaParda";
    const res = await this.tirarHabilidad(clave, { dificultad: dif, notas: ["Zafarse: Agilidad del oponente + 3"] });
    if (res?.resultado.exito) {
      await this.update({ "system.combate.inmovilizado": false });
      await publicar({ tono: "exito", icono: "fa-solid fa-person-running", etiqueta: "Se zafa", titulo: this.name, texto: "No podrá ser inmovilizado de nuevo por el mismo enemigo en este turno ni en el siguiente." }, { actor: this });
    }
    return res;
  }

  async huir() {
    return publicar({
      tono: "aviso", icono: "fa-solid fa-person-walking-arrow-right", etiqueta: "Huir", titulo: this.name,
      texto: "Da la espalda al oponente: este gana un ataque de oportunidad (solo uno por turno). Después, el DJ decide si lo deja escapar o empieza una persecución a distancia corta."
    }, { actor: this });
  }

  async alternarCobertura(nivel) {
    return this.update({ "system.combate.cobertura": nivel });
  }

  /* ---------------- Salud y Estabilidad ---------------- */

  async modifyTokenAttribute(atributo, valor, esDelta = false, esBarra = true) {
    if (atributo !== "salud") return super.modifyTokenAttribute(atributo, valor, esDelta, esBarra);
    const actual = n(this.system.salud.valor);
    const nuevo = Math.max(0, Math.min(n(this.system.salud.max), esDelta ? actual + n(valor) : n(valor)));
    return nuevo < actual ? this.aplicarDano(actual - nuevo) : nuevo > actual ? this.curar(nuevo - actual) : this;
  }

  _umbralesSalud() {
    const ctx = contexto();
    const u = ctx.conjunto.umbralesSalud;
    return ctx.pulp && this.esPJ ? R.umbralesPulp(u) : u;
  }

  async aplicarDano(cantidad, { sinUmbrales = false } = {}) {
    const s = this.system;
    const ctx = contexto();
    const antes = n(s.salud.valor);
    const despues = Math.max(0, antes - n(cantidad));
    const cambios = { "system.salud.valor": despues };
    if (despues <= 0) {
      if (ctx.opciones.noMorir && this.esPJ) { cambios["system.estado.fueraDeJuego"] = true; }
      else cambios["system.estado.muerto"] = true;
    }
    if (ctx.conjunto.id === "imserso" && despues === 1) cambios["system.estado.inconsciente"] = true;
    const cruzados = sinUmbrales || despues <= 0 ? [] : R.umbralesCruzados(antes, despues, this._umbralesSalud(), s.resistenciaFisica.umbrales);
    for (const u of cruzados) cambios[`system.resistenciaFisica.umbrales.${u}`] = true;
    await this.update(cambios);
    if (cruzados.length) await publicarUmbrales(this, cruzados, "salud");
  }

  async curar(cantidad) {
    const s = this.system;
    const valor = Math.min(n(s.salud.max), n(s.salud.valor) + n(cantidad));
    const cambios = { "system.salud.valor": valor };
    if (valor > 0 && s.estado.fueraDeJuego) cambios["system.estado.fueraDeJuego"] = false;
    return this.update(cambios);
  }

  async perderEstabilidad(cantidad, { sinUmbrales = false } = {}) {
    if (!this.esPJ || !contexto().conjunto.tienePanico) return null;
    const s = this.system;
    const antes = n(s.estabilidad.valor);
    const despues = Math.max(0, antes - n(cantidad));
    const u = contexto().pulp ? R.umbralesPulp(contexto().conjunto.umbralesEstabilidad) : contexto().conjunto.umbralesEstabilidad;
    const cruzados = sinUmbrales || despues <= 0 ? [] : R.umbralesCruzados(antes, despues, u, s.resistenciaMental.umbrales);
    const cambios = { "system.estabilidad.valor": despues };
    for (const x of cruzados) cambios[`system.resistenciaMental.umbrales.${x}`] = true;
    if (despues <= 0) cambios["system.estado.crisisMental"] = true;
    await this.update(cambios);
    if (despues <= 0) await publicar({ tono: "pifia", icono: "fa-solid fa-brain", etiqueta: "Locura", titulo: this.name, texto: "Pierde el último punto de Estabilidad: enloquece para siempre." }, { actor: this });
    if (cruzados.length) await publicarUmbrales(this, cruzados, "estabilidad", n(cantidad));
  }

  async recuperarEstabilidad(cantidad) {
    if (!this.esPJ) return null;
    const s = this.system;
    const valor = Math.min(n(s.estabilidad.max), n(s.estabilidad.valor) + n(cantidad));
    const cambios = { "system.estabilidad.valor": valor };
    if (valor > 0) cambios["system.estado.crisisMental"] = false;
    return this.update(cambios);
  }

  /* ---------------- Curación reglada (cap. 6) ---------------- */

  _fuentesCuracion() {
    const ctx = contexto();
    return ctx.conjunto.id === "imserso" ? R.CURACION_IMSERSO : R.fuentesCuracion(ctx.edicion);
  }

  async curacionRegla() {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const marca = objetivoActual();
    const objetivo = marca?.actor ?? this;
    const fuentes = this._fuentesCuracion();
    const usadas = objetivo.esPJ ? objetivo.system.curaciones : {};
    const entradas = Object.entries(fuentes);
    const ok = entradas.filter(([k]) => R.curacionDisponible(fuentes, k, usadas).ok);
    const fuera = entradas.filter(([k]) => !R.curacionDisponible(fuentes, k, usadas).ok);
    if (!ok.length) return ui.notifications.warn("No queda ninguna fuente de curación disponible.");
    const etiquetaFrec = { dia: "al día", dia3: "cada 3 días", sesion: "por sesión", herida: "por herida" };
    const d = await pedirDatos({
      titulo: `Curación · ${objetivo.name}`,
      intro: `<p>Salud ${objetivo.system.salud.valor}/${objetivo.system.salud.max}${objetivo.esPJ && cj.tienePanico ? ` · Estabilidad ${objetivo.system.estabilidad.valor}/${objetivo.system.estabilidad.max}` : ""}. No se supera lo que se tenía al empezar la aventura.${fuera.length ? ` <small>Ahora no: ${fuera.map(([, f]) => esc(f.etiqueta)).join("; ")}.</small>` : ""}</p>`,
      filas: [
        { nombre: "fuente", tipo: "sel", etiqueta: "Fuente", valor: ok[0][0], opciones: ok.map(([valor, f]) => ({ valor, etiqueta: `${f.etiqueta} · ${R.convalecencia(f.cantidad, ctx.opciones.convalecencias && f.frecuencia === "dia")}${f.critico ? `/${f.critico}` : ""} (${etiquetaFrec[f.frecuencia]})` })) },
        ...(objetivo.esPJ && cj.tienePanico ? [{ nombre: "recurso", tipo: "sel", etiqueta: "Recupera", valor: "salud", opciones: [{ valor: "salud", etiqueta: "Salud" }, { valor: "estabilidad", etiqueta: "Estabilidad" }] }] : [])
      ],
      ok: "Preparar"
    });
    if (!d?.fuente) return null;
    const f = fuentes[d.fuente];
    const recurso = f.aplica.includes(d.recurso ?? "salud") ? (d.recurso ?? "salud") : f.aplica[0];
    let cantidad = R.convalecencia(f.cantidad, ctx.opciones.convalecencias && f.frecuencia === "dia");
    const lineas = [];
    if (f.habilidad) {
      const res = await this.tirarHabilidad(f.habilidad, { dificultad: f.dificultad });
      if (!res) return null;
      const mano = this.fx.auxilioCura;
      if (!res.resultado.exito) {
        cantidad = 0; lineas.push("La tirada falla: no se recupera nada.");
        if (res.resultado.pifia && (f.pifiaDano || mano)) {
          const dano = mano?.pifia !== undefined && f.habilidad === "auxilio" ? 0 : f.pifiaDano;
          if (dano) { await (recurso === "estabilidad" ? objetivo.perderEstabilidad(dano) : objetivo.aplicarDano(dano)); lineas.push(`Pifia: ${dano} puntos de pérdida.`); }
        }
      } else if (res.resultado.critico && f.critico) cantidad = mano && f.habilidad === "auxilio" ? mano.critico : f.critico;
      else if (mano && f.habilidad === "auxilio") cantidad = mano.normal;
    }
    if (objetivo.esPJ && f.frecuencia !== "herida") {
      await objetivo.update({ [`system.curaciones.${f.frecuencia}`]: [...objetivo.system.curaciones[f.frecuencia], d.fuente] });
    }
    return publicarEfecto({
      clase: "cura", recurso, objetivoUuid: objetivo.uuid, tokenUuid: marca?.document?.uuid ?? "", objetivo: objetivo.name,
      cantidad, original: cantidad, etiqueta: f.etiqueta, lineas, estado: cantidad ? "pendiente" : "cancelado"
    }, { actor: this });
  }

  /* ---------------- Otras fuentes de daño (cap. 5) ---------------- */

  async danoRegla() {
    const ctx = contexto();
    const cj = ctx.conjunto;
    const ed = ctx.edicion;
    const yayo = cj.id !== "srd";
    const fuerza = cj.habilidades.fuerzaBruta ? "fuerzaBruta" : "mulaParda";
    const ingesta = cj.habilidades.ingesta ? "ingesta" : cj.id === "imserso" ? "conducir" : fuerza;
    const fuentes = { asfixia: "Asfixia", caida: "Caída", congelacion: "Congelación", electrochoque: "Electrochoque", sobreesfuerzo: "Sobreesfuerzo", veneno: "Envenenamiento", hambre: "Hambre", sed: "Sed", borrachera: "Borrachera", quemadura: "Quemadura" };
    const a = await pedirDatos({
      titulo: `Daño reglado · ${this.name}`,
      filas: [{ nombre: "fuente", tipo: "sel", etiqueta: "Qué le ocurre", valor: "caida", opciones: Object.entries(fuentes).map(([valor, etiqueta]) => ({ valor, etiqueta })) }],
      ok: "Siguiente"
    });
    if (!a) return null;
    const f = a.fuente;
    const fue = this.system.efectivos.atributos.fue;
    const preguntas = {
      asfixia: [{ nombre: "turnos", tipo: "num", etiqueta: `Turnos sin respirar (aguanta ${R.aguanteRespiracion(fue)} sin tirar)`, valor: 1, min: 0 }],
      caida: [{ nombre: "metros", tipo: "num", etiqueta: `Metros de caída libre (hace daño desde ${ed.caida.desde} m)`, valor: 3, min: 0 }],
      congelacion: [{ nombre: "minutos", tipo: "num", etiqueta: `Minutos de frío intenso (1 punto cada ${ed.congelacionMinutos})`, valor: 30, min: 0 }],
      veneno: [{ nombre: "pot", tipo: "num", etiqueta: "Potencia (POT)", valor: 10, min: 1 }, { nombre: "menor", tipo: "num", etiqueta: "Daño menor", valor: 0, min: 0 }, { nombre: "mayor", tipo: "num", etiqueta: "Daño mayor", valor: 3, min: 0 }],
      hambre: [{ nombre: "horas", tipo: "num", etiqueta: `Horas sin comer (1 punto cada ${ed.hambreHoras})`, valor: ed.hambreHoras, min: 0 }],
      sed: [{ nombre: "horas", tipo: "num", etiqueta: `Horas sin beber (1 punto cada ${ed.sedHoras})`, valor: ed.sedHoras, min: 0 }],
      borrachera: [{ nombre: "pot", tipo: "sel", etiqueta: "Gravedad", valor: 10, opciones: R.BORRACHERAS }],
      quemadura: [{ nombre: "turnos", tipo: "num", etiqueta: "Turnos en fuego abierto (3 por turno)", valor: 1, min: 0 }, { nombre: "sol", tipo: "check", etiqueta: "Es sol sin protección (1 de Salud)", valor: false }]
    };
    const b = preguntas[f] ? await pedirDatos({ titulo: fuentes[f], filas: preguntas[f], ok: "Resolver" }) : {};
    if (!b) return null;
    let cantidad = 0, resumen = "";
    const tirar = (clave, dificultad, nota) => this.tirarHabilidad(clave, { dificultad, dialogo: false, datos: { dificultad }, notas: [nota] });
    if (f === "asfixia") {
      if (n(b.turnos) <= R.aguanteRespiracion(fue)) resumen = `Aguanta: tiene ${R.aguanteRespiracion(fue)} turnos sin tirar.`;
      else { const res = await tirar(fuerza, 15, "Asfixia"); cantidad = res?.resultado.exito ? 0 : 3; resumen = res?.resultado.exito ? "Aguanta otro turno." : "Falla: pierde 3 de Salud por turno."; }
    } else if (f === "caida") {
      const res = await tirar("atletismo", 12, "Caída: rodar reduce 3");
      cantidad = yayo ? Math.max(0, R.danoYayo.caida(b.metros) - (res?.resultado.exito ? 3 : 0)) : R.danoCaida(b.metros, ed, Boolean(res?.resultado.exito));
      resumen = res?.resultado.exito ? "Supera Atletismo 12: cae rodando y reduce el daño en 3." : "Falla Atletismo 12: recibe todo el daño.";
    } else if (f === "congelacion") cantidad = R.danoFrio(b.minutos, ed);
    else if (f === "electrochoque") {
      cantidad = R.danoElectrochoque(this.system.efectivos.atributos.per);
      const res = await tirar(fuerza, 20, "Electrochoque");
      resumen = res?.resultado.exito ? "Resiste la descarga." : "Falla: queda incapacitado 3D minutos, sin poder hablar, y −1D a todo durante la hora siguiente.";
    } else if (f === "sobreesfuerzo") { const res = await tirar(fuerza, 15, "Sobreesfuerzo"); cantidad = res?.resultado.exito ? 0 : 2; }
    else if (f === "veneno") { const res = await tirar(ingesta, n(b.pot), `Veneno POT ${b.pot}`); cantidad = res?.resultado.exito ? n(b.menor) : n(b.mayor); }
    else if (f === "hambre") cantidad = yayo ? R.danoYayo.hambre(b.horas) : R.danoHambre(b.horas, ed);
    else if (f === "sed") cantidad = yayo ? R.danoYayo.sed(b.horas) : R.danoSed(b.horas, ed);
    else if (f === "borrachera") {
      const res = await tirar(ingesta, n(b.pot), "Borrachera");
      if (res && !res.resultado.exito) { cantidad = yayo ? R.danoYayo.cogorza(n(b.pot)) : R.danoBorrachera(n(b.pot)); resumen = "Borrachera: −1D a todas las tiradas durante 6 horas."; }
    } else if (f === "quemadura") cantidad = b.sol ? 1 : 3 * n(b.turnos);
    return publicarEfecto({
      clase: "dano", objetivoUuid: this.uuid, objetivo: this.name, cantidad, original: cantidad, etiqueta: fuentes[f], texto: resumen,
      estado: cantidad > 0 ? "pendiente" : "resistido"
    }, { actor: this });
  }

  /* ---------------- Persecuciones y pánico ---------------- */

  async perseguir() {
    const objetivo = objetivoActual()?.actor;
    const cj = contexto().conjunto;
    const d = await pedirDatos({
      titulo: `Persecución · ${this.name}`,
      filas: [
        { nombre: "perseguidor", tipo: "sel", etiqueta: "Papel", valor: "si", opciones: [{ valor: "si", etiqueta: "Persigue" }, { valor: "no", etiqueta: "Huye" }] },
        { nombre: "agilidad", tipo: "num", etiqueta: `${cj.fijos.agilidad} del otro${objetivo ? ` (${objetivo.name})` : ""}`, valor: objetivo?.valorFijo("agilidad") ?? 10, min: 1, max: 60 }
      ],
      ok: "Empezar"
    });
    if (!d) return null;
    return publicarPersecucion(this, { objetivo: objetivo?.name ?? "su objetivo", agilidad: d.agilidad, perseguidor: d.perseguidor === "si" });
  }

  /* ---------------- Poder: magia y psiónica ---------------- */

  async lanzarPoder(item) {
    const ctx = contexto();
    if (ctx.conjunto.id === "dungeonsYayos") {
      // Magia Potagia: solo con 2D o 3D; sin puntos de Poder (los hechizos al día los lleva la mesa).
      if (n(this.system.efectivos.habilidades.magiaPotagia.dados) < 2) return ui.notifications.warn("Magia Potagia solo puede usarse con 2D o 3D en la habilidad.");
      let dificultad = n(item.system.dificultad, 12);
      const obj = objetivoActual()?.actor;
      if (obj && item.system.contra) dificultad = Math.max(dificultad, obj.valorFijo(item.system.contra));
      return this.tirarHabilidad("magiaPotagia", { dificultad, notas: [`Hechizo: ${item.name}`] });
    }
    if (!ctx.poderes) return ui.notifications.warn("La magia o psiónica no está activa en esta ambientación (Ajustes del sistema).");
    const s = this.system;
    const etiq = ctx.poderes === "psionica" ? "Psiónica" : "Magia";
    if (!this.esPJ && s.poder.valor <= 0) return ui.notifications.warn(`${this.name} se ha quedado sin puntos de Poder.`);
    const dif = n(item.system.dificultad, 8);
    const coste = R.costePoder(dif, item.system.costeExtra);
    const atributo = item.system.atributo && ctx.conjunto.atributos[item.system.atributo] ? item.system.atributo : "int";
    const marca = objetivoActual();
    const obj = marca?.actor;
    let dificultad = dif;
    const notas = [`${etiq}: ${dif} · cuesta ${coste} de Poder, salga o no`];
    if (obj && item.system.contra) {
      const valor = obj.valorFijo(item.system.contra);
      if (valor > dif) { dificultad = valor; notas.push(`Contra ${ctx.conjunto.fijos[item.system.contra]} de ${obj.name}: ${valor}`); }
    }
    const pen = n(s.poder.valor) <= 0 ? 1 : 0;
    const res = await this.tirarHabilidad("magia", { dificultad, notas: pen ? [...notas, "Sin Poder: mareado, −1D"] : notas, atributoPoder: atributo });
    if (!res) return null;
    const gasto = Math.min(n(s.poder.valor), coste);
    await this.update({ "system.poder.valor": Math.max(0, n(s.poder.valor) - coste) });
    const lineas = [
      item.system.tipo && { texto: `<strong>Tipo:</strong> ${esc(item.system.tipo)}` },
      item.system.preparacion && { texto: `<strong>Preparación:</strong> ${esc(item.system.preparacion)}` },
      item.system.lanzamiento && { texto: `<strong>Lanzamiento:</strong> ${esc(item.system.lanzamiento)}` },
      item.system.duracion && { texto: `<strong>Duración:</strong> ${esc(item.system.duracion)}` },
      item.system.caducidad && { texto: `<strong>Caducidad:</strong> ${esc(item.system.caducidad)}` },
      { texto: `Poder: ${n(s.poder.valor)} → ${Math.max(0, n(s.poder.valor) - coste)}${gasto < coste ? " (agotado)" : ""}` }
    ].filter(Boolean);
    return publicar({ tono: res.resultado.exito ? "exito" : "fallo", icono: "fa-solid fa-wand-sparkles", etiqueta: item.name, subtitulo: this.name, resultado: res.resultado.exito ? "Funciona" : "Fracasa", texto: item.system.descripcion, lineas, img: item.img }, { actor: this });
  }

  /** Ocho horas de sueño reparador devuelven todo el Poder; menos, la parte proporcional. */
  async descansarPoder() {
    const d = await pedirDatos({ titulo: `Descanso · ${this.name}`, filas: [{ nombre: "horas", tipo: "num", etiqueta: "Horas de sueño reparador", valor: 8, min: 1, max: 12 }], ok: "Descansar" });
    if (!d) return null;
    const s = this.system;
    const nuevo = Math.min(n(s.poder.max), n(s.poder.valor) + R.recuperaPoder(s.poder.max, d.horas));
    await this.update({ "system.poder.valor": nuevo });
    return publicar({ tono: "exito", icono: "fa-solid fa-moon", etiqueta: "Descanso", titulo: `Poder ${nuevo}/${s.poder.max}`, texto: `${this.name} duerme ${d.horas} horas.` }, { actor: this });
  }

  /* ---------------- Talentos, XP y mejora ---------------- */

  async usarTalento(item) {
    const clave = claveTalento(item.name);
    const s = item.system;
    const limitado = n(s.usos.max) > 0;
    const tarjeta = (texto, extra = {}) => publicar({ tono: "aviso", icono: "fa-solid fa-star", etiqueta: "Talento", titulo: item.name, texto, img: item.img, ...extra }, { actor: this });
    if (limitado && n(s.usos.valor) < 1) return ui.notifications.warn(`${item.name} ya se ha usado (${s.frecuencia === "escena" ? "en esta escena" : "en esta sesión"}).`);
    if (clave === "afortunado") {
      if (n(this.system.proezas.valor) >= n(this.system.proezas.inicial)) return ui.notifications.info("No hay ninguna proeza gastada que recuperar.");
      await this.ganarProeza(1, { silencioso: true });
    }
    if (clave === "retroceder-nunca-rendirse-jamas") {
      if (!(await this.gastarProeza(1, { silencioso: true }))) return null;
      await this.update({ "system.combate.ignoraPenalizador": true });
      await tarjeta(`${this.name} gasta una proeza e ignora los penalizadores por pérdida de Salud durante todo este combate.`);
      return;
    }
    if (clave === "meditacion") {
      if (!(await this.gastarProeza(1, { silencioso: true }))) return null;
    }
    if (clave === "cinturon-de-herramientas" || clave === "damisela-en-apuros") {
      if (!(await this.gastarProeza(1, { silencioso: true }))) return null;
    }
    if (limitado) await item.update({ "system.usos.valor": n(s.usos.valor) - 1 });
    return tarjeta(s.descripcion || "Usa el talento.");
  }

  async ganarXP(puntos, motivo = "") {
    if (!this.esPJ) return null;
    await this.update({ "system.experiencia.total": n(this.system.experiencia.total) + n(puntos) });
    return publicar({ tono: "exito", icono: "fa-solid fa-arrow-up-right-dots", etiqueta: "Experiencia", titulo: `+${puntos}`, texto: `${this.name} gana ${puntos} ${puntos === 1 ? "punto" : "puntos"} de Experiencia${motivo ? ` (${motivo})` : ""}.` }, { actor: this });
  }

  /** Gastar Experiencia: habilidad 1→2D = 5, 2→3D = 10; atributo: nuevo bonificador × 3, de uno en uno. */
  async mejorar() {
    if (!this.esPJ) return null;
    const cj = contexto().conjunto;
    const s = this.system;
    const disponible = n(s.xpDisponible);
    const habs = Object.entries(cj.habilidades).filter(([k]) => dado(s.habilidades[k].dados) < 3).map(([k, h]) => {
      const dd = dado(s.habilidades[k].dados);
      return { valor: `h:${k}`, etiqueta: `${h.label} ${dd}D → ${dd + 1}D (${R.costeHabilidad(dd)} XP)`, coste: R.costeHabilidad(dd) };
    });
    const atrs = Object.entries(cj.atributos).map(([k, a]) => {
      const v = n(s.atributos[k]);
      return { valor: `a:${k}`, etiqueta: `${a.label} ${sig(v)} → ${sig(v + 1)} (${R.costeAtributo(v + 1)} XP)`, coste: R.costeAtributo(v + 1) };
    });
    const opciones = [...habs, ...atrs].filter(o => o.coste <= disponible);
    if (!opciones.length) return ui.notifications.warn(`${this.name} tiene ${disponible} XP: no alcanza para ninguna mejora.`);
    const d = await pedirDatos({
      titulo: `Mejorar · ${this.name}`, intro: `<p>Experiencia disponible: <strong>${disponible}</strong>. Los atributos suben de uno en uno y pueden cambiar la Salud, el Aplomo, la Perspicacia, las Resistencias y la iniciativa.</p>`,
      filas: [{ nombre: "mejora", tipo: "sel", etiqueta: "Mejora", valor: opciones[0].valor, opciones }], ok: "Mejorar"
    });
    if (!d) return null;
    const elegida = opciones.find(o => o.valor === d.mejora);
    const [tipo, k] = d.mejora.split(":");
    const cambios = { "system.experiencia.gastada": n(s.experiencia.gastada) + elegida.coste };
    if (tipo === "h") cambios[`system.habilidades.${k}.dados`] = dado(s.habilidades[k].dados) + 1;
    else cambios[`system.atributos.${k}`] = n(s.atributos[k]) + 1;
    await this.update(cambios);
    return publicar({ tono: "exito", icono: "fa-solid fa-arrow-up", etiqueta: "Mejora", titulo: elegida.etiqueta.replace(/ \(\d+ XP\)$/, ""), texto: `${this.name} gasta ${elegida.coste} XP.${tipo === "h" ? " Aprender de un maestro lleva 1D semanas (1→2D) o 1D meses (2→3D)." : ""}` }, { actor: this });
  }

  /** Anexo Pulp: tirada de salvación in extremis, una vez por aventura. */
  async salvacionPulp() {
    if (!contexto().pulp) return ui.notifications.warn("La tirada de salvación es del Anexo Pulp.");
    if (this.system.pulp.salvacionUsada) return ui.notifications.warn(`${this.name} ya ha usado su tirada de salvación en esta aventura.`);
    const roll = await new Roll("3d6").evaluate();
    await mostrar(roll);
    await this.update({ "system.pulp.salvacionUsada": true });
    return publicar({
      tono: "critico", icono: "fa-solid fa-hands-praying", etiqueta: "¡Salvación in extremis!", subtitulo: this.name, resultado: `${roll.total}`,
      titulo: "Lo logro o lo evito gracias a…", texto: R.TABLA_PULP[roll.total], pie: "Describe la escena a partir del resultado."
    }, { actor: this, rolls: [roll] });
  }

  /* ---------------- Sesión, día y aventura ---------------- */

  /** Nueva sesión: proezas a las iniciales, defecto leve, umbrales, usos de talentos y efectos de combate (cap. 3 y 5). */
  async nuevaSesion() {
    const s = this.system;
    const ctx = contexto();
    const cambios = {
      "system.resistenciaFisica.umbrales": Object.fromEntries(R.UMBRALES.map(u => [u, false])),
      "system.combate.sorprendido": false, "system.combate.inmovilizado": false, "system.combate.defensaCompleta": 0,
      "system.combate.refuerzoAgilidad": 0, "system.combate.refuerzoAplomo": 0, "system.combate.refuerzoPerspicacia": 0,
      "system.combate.ignoraPenalizador": false, "system.combate.cobertura": "ninguna", "system.combate.resguardado": false
    };
    let sobran = 0, extra = 0, roll = null;
    if (this.esPJ) {
      sobran = R.proezasSobrantes(s.proezas.valor, s.proezas.inicial);
      if (ctx.pulp) { roll = await new Roll("1d6").evaluate(); await mostrar(roll); extra = R.proezasExtraPulp(roll.total); }
      Object.assign(cambios, {
        "system.proezas.valor": n(s.proezas.inicial) + extra, "system.defectos.leveUsado": false,
        "system.resistenciaMental.umbrales": Object.fromEntries(R.UMBRALES.map(u => [u, false])),
        "system.curaciones.sesion": [], "system.usosTalentos": {}
      });
    }
    await this.update(cambios);
    const usos = this.items.filter(i => i.type === "talento" && i.system.usos.max > 0 && i.system.frecuencia !== "aventura").map(i => ({ _id: i.id, "system.usos.valor": i.system.usos.max }));
    if (usos.length) await this.updateEmbeddedDocuments("Item", usos);
    return { sobran, extra, roll };
  }

  /** Nuevo día: Salud (y Estabilidad cada tres) por recuperación natural y fuentes que se reponen (cap. 6). */
  async nuevoDia({ tercerDia = false } = {}) {
    const s = this.system;
    const a = s.efectivos.atributos;
    const lineas = [];
    const cambios = {};
    if (this.esPJ) {
      cambios["system.curaciones.dia"] = [];
      const salud = R.convalecencia(R.recuperacionNatural(a.fue), contexto().opciones.convalecencias);
      if (salud && s.salud.valor < s.salud.max && s.salud.valor > 0) { cambios["system.salud.valor"] = Math.min(s.salud.max, s.salud.valor + salud); lineas.push(`+${salud} de Salud (FUE ${sig(a.fue)})`); }
      if (tercerDia) {
        cambios["system.curaciones.dia3"] = [];
        const est = R.recuperacionNatural(a.car);
        if (est && contexto().conjunto.tienePanico && s.estabilidad.valor < s.estabilidad.max && s.estabilidad.valor > 0) { cambios["system.estabilidad.valor"] = Math.min(s.estabilidad.max, s.estabilidad.valor + est); lineas.push(`+${est} de Estabilidad (CAR ${sig(a.car)})`); }
      }
      await this.update(cambios);
    }
    return lineas;
  }

  /** Nueva aventura: Recuerdo, punto de guion, salvación Pulp, estados y curaciones (cap. 3). */
  async nuevaAventura({ restaurar = false } = {}) {
    if (!this.esPJ) return null;
    const s = this.system;
    const cambios = {
      "system.recuerdo.usado": false, "system.recuerdo.usos": 0, "system.puntoGuion.valor": s.puntoGuion.max, "system.puntoGuion.usado": false,
      "system.pulp.salvacionUsada": false, "system.curaciones.dia": [], "system.curaciones.dia3": [], "system.curaciones.sesion": [],
      "system.estado.inconsciente": false, "system.estado.crisisMental": false, "system.estado.fueraDeJuego": false
    };
    if (restaurar) { cambios["system.salud.valor"] = s.salud.max; cambios["system.estabilidad.valor"] = s.estabilidad.max; }
    await this.update(cambios);
    return this.nuevaSesion();
  }

  /** Punto de guion (cap. 3): crear un contacto, un recurso dramático o un objeto útil. */
  async usarPuntoGuion() {
    if (!this.esPJ || !contexto().edicion.puntoGuion) return ui.notifications.warn("El punto de guion es de Ysystem3; la Edición Revisada no lo tiene.");
    const g = this.system.puntoGuion;
    if (n(g.valor) < 1) return ui.notifications.warn(`${this.name} ya ha gastado su punto de guion.`);
    await this.update({ "system.puntoGuion.valor": n(g.valor) - 1, "system.puntoGuion.usado": n(g.valor) - 1 <= 0 });
    return publicar({
      tono: "aviso", icono: "fa-solid fa-feather-pointed", etiqueta: "Punto de guion", titulo: this.name,
      texto: "Crea un contacto útil, un recurso dramático ambiental o un objeto físico útil en las inmediaciones. El DJ supervisa que sea lógico y plausible."
    }, { actor: this });
  }

  /* ---------------- Arquetipos ---------------- */

  async aplicarArquetipo(clave, sistema = null) {
    if (!this.esPJ) return ui.notifications.warn("Los arquetipos solo se aplican a PJ.");
    const base = arquetipoByKey(clave);
    const a = sistema ? { ...base, ...this._arquetipoDeItem(base, sistema, clave) } : base;
    if (!a?.attrs) return ui.notifications.warn("Elige un arquetipo válido.");
    const si = await confirmar({
      titulo: `Aplicar arquetipo: ${a.name}`,
      contenido: "<p>Ajusta atributos, habilidades, perfil, talento, proezas, Salud y Resistencias a la plantilla. No cambia nombre, jugador, retrato ni biografía.</p>",
      si: "Aplicar"
    });
    if (!si) return null;
    const roll = await new Roll("2d6").evaluate();
    const [tSalud, tEst] = roll.dice[0].results.map(r => r.result);
    await this.update(archetypeSystem(a, tSalud, tEst));
    if (!this.items.some(i => i.type === "talento" && i.name === a.talentName)) await this.createEmbeddedDocuments("Item", [archetypeTalentItem(a)]);
    return publicar({
      tono: "aviso", icono: "fa-solid fa-stamp", etiqueta: "Arquetipo", titulo: a.name,
      lineas: [
        { texto: `Salud inicial: ${a.saludBase} + 1D6 (${tSalud}) = <strong>${a.saludBase + tSalud}</strong> · Proezas <strong>${a.proezas}</strong> · Resistencia física <strong>${a.resistenciaFisica}</strong>` },
        { texto: `<strong>${esc(a.talentName)}.</strong> ${esc(a.talent)}` }
      ]
    }, { actor: this, rolls: [roll] });
  }

  _arquetipoDeItem(base, s, clave) {
    const llena = (v, alt) => ((Array.isArray(v) ? v.length : v && Object.keys(v).length) ? foundry.utils.deepClone(v) : alt);
    return {
      key: s.arquetipoKey || base?.key || clave, name: base?.name || clave, perfil: s.perfil || base?.perfil || "",
      attrs: llena(s.atributos, base?.attrs), d3: llena(s.habilidades3d, base?.d3 ?? []), d2: llena(s.habilidades2d, base?.d2 ?? []),
      proezas: n(s.proezas, base?.proezas), resistenciaFisica: n(s.resistenciaFisica, base?.resistenciaFisica ?? 10), saludBase: n(s.saludBase, base?.saludBase ?? 10),
      talentName: s.talentoNombre || base?.talentName || "Talento", talent: s.talento || base?.talent || ""
    };
  }

  /* ---------------- Nombres de la versión 0.x (macros y módulos existentes) ---------------- */

  rollSkill(...a) { return this.tirarHabilidad(...a); }
  rollAttack(...a) { return this.atacar(...a); }
  rollResistenciaFisica(o) { return this.tirarResistencia("fisica", o); }
  rollResistenciaMental(o) { return this.tirarResistencia("mental", o); }
  rollJamacuco(o) { return this.tirarResistencia("fisica", o); }
  applyDamage(c) { return this.aplicarDano(c); }
  heal(c) { return this.curar(c); }
  healStability(c) { return this.recuperarEstabilidad(c); }
  applyStabilityDamage(c) { return this.perderEstabilidad(c); }
  spendProezas(c) { return this.gastarProeza(c, { silencioso: false }); }
  gainProezas(c, notify = true) { return this.ganarProeza(c, { silencioso: !notify }); }
  canSpendProezas(c) { return this.puedeGastarProeza(c); }
  spendYayopoints(c) { return this.gastarProeza(c); }
  gainYayopoints(c) { return this.ganarProeza(c); }
  spendPuntoGuion() { return this.usarPuntoGuion(); }
}
