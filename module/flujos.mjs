/**
 * Flujos con estado en el chat. Cada tarjeta guarda su estado en `flags.ysystem3-srd.estado` y, al cambiar,
 * se vuelve a pintar entera (ver chat.mjs). Aquí viven: tiradas (con repetición por proeza, por talento o por defecto),
 * daño y curación pendientes de aplicar, umbrales de Salud y Estabilidad, pánico, persecuciones, tortura y duelos.
 * Las reglas numéricas están en reglas.mjs; aquí solo se orquesta Foundry.
 */
import { ID, etiquetaHabilidad } from "./config.mjs";
import * as R from "./reglas.mjs";
import { contexto } from "./ajustes.mjs";
import { publicar, guardar, registrarVista, registrarAccion } from "./chat.mjs";
import { pedirDatos } from "./dialogos.mjs";
import { aplica } from "./talentos.mjs";

const esc = foundry.utils.escapeHTML;
const sig = n => (n > 0 ? `+${n}` : `${n}`);
const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** Hace visibles en el tablero (Dice So Nice) los dados de una tirada ya evaluada. */
async function mostrar(roll) {
  if (!roll || !game.dice3d?.showForRoll) return;
  try { await game.dice3d.showForRoll(roll, game.user, true, null, false); } catch (e) { console.warn("Ysystem3 SRD | Dice So Nice", e); }
}

async function rolar(cuantos, formula = "d6") {
  if (cuantos <= 0) return [];
  const roll = await new Roll(`${cuantos}${formula}`).evaluate();
  await mostrar(roll);
  return roll.dice[0].results.map(r => r.result);
}

const resolverObjetivo = async s => (s.tokenUuid && (await fromUuid(s.tokenUuid))?.actor) || (await fromUuid(s.objetivoUuid));

/* ------------------------------------------------------------------ */
/* Tiradas                                                            */
/* ------------------------------------------------------------------ */

export function resultado(e) {
  return R.evaluar({ caras: e.caras, atributo: e.atributo, bonus: e.bonus, dificultad: e.dificultad, tipo: e.tipo, critUnSeis: e.critUnSeis, sinCritico: e.sinCritico });
}

const ES_RESISTENCIA = tipo => tipo === "resistenciaFisica" || tipo === "resistenciaMental";

function repeticionGratisDisponible(actor, e) {
  const g = actor?.fx?.repeticionGratis;
  if (!g || e.repeticion || e.defecto) return null;
  if (g.habilidades && !g.habilidades.includes(e.clave)) return null;
  if (g.usos && n(actor.system.usosTalentos?.repeticiones) >= g.usos) return null;
  return g;
}

export function vistaTirada(e) {
  const r = resultado(e);
  const actor = fromUuidSync(e.actorUuid);
  const pj = actor?.type === "personaje";
  const cj = contexto().conjunto;
  const tono = r.critico ? "critico" : r.pifia ? "pifia" : r.exito ? "exito" : "fallo";
  const botones = [];
  const repetible = pj && !r.exito && !e.repeticion && !e.defecto && e.dados > 0 && (e.tipo === "habilidad" || ES_RESISTENCIA(e.tipo));
  if (repetible) {
    botones.push({ accion: "proeza", etiqueta: `Repetir con ${cj.recursoUno}`, icono: "fa-solid fa-star", quien: "dueno", uuid: e.actorUuid, principal: true });
  }
  if (!r.exito && e.dados > 0 && repeticionGratisDisponible(actor, e) && (e.tipo === "habilidad" || ES_RESISTENCIA(e.tipo))) {
    botones.push({ accion: "gratis", etiqueta: "Repetir gratis (talento)", icono: "fa-solid fa-rotate", quien: "dueno", uuid: e.actorUuid });
  }
  if (pj && e.tipo === "habilidad" && !e.defecto && e.dados > 0) {
    const d = actor.system.defectos;
    botones.push({ accion: "defecto-grave", etiqueta: `${cj.defectoGrave}${d.grave ? `: ${d.grave}` : ""}`, icono: "fa-solid fa-heart-crack", quien: "gm" });
    if (!d.leveUsado) botones.push({ accion: "defecto-leve", etiqueta: `${cj.defectoLeve}${d.leve ? `: ${d.leve}` : ""}`, icono: "fa-solid fa-bandage", quien: "gm" });
  }
  const lineas = e.notas.map(texto => ({ texto: esc(texto), icono: "fa-solid fa-angle-right" }));
  if (e.ataque) lineas.unshift({ texto: `<strong>${esc(e.ataque.etiqueta)}</strong> contra ${esc(e.ataque.objetivoNombre)} (${esc(e.ataque.valor ?? "Agilidad")} ${e.dificultad})`, icono: "fa-solid fa-burst" });
  const formula = `${e.dados}D6${e.atributo ? ` ${sig(e.atributo)}` : ""}${e.bonus ? ` ${sig(e.bonus)}` : ""}`;
  return {
    tono, icono: ES_RESISTENCIA(e.tipo) ? "fa-solid fa-heart-pulse" : "fa-solid fa-dice-six", etiqueta: e.etiqueta,
    subtitulo: e.flavor, resultado: r.critico ? "Éxito crítico" : r.pifia ? "Pifia" : r.exito ? "Éxito" : "Fallo",
    dados: e.caras.map((v, i) => ({ v, c: e.marcas?.[i] ?? "n", seis: v === 6 })),
    conTotal: true, total: r.total, dificultad: e.dificultad,
    formula: e.repeticion ? `${formula} · repetida` : formula, lineas, botones
  };
}
registrarVista("tirada", vistaTirada);

/** Efectos posteriores a cada resolución: proezas por crítico, estado de Resistencia, tarjeta de daño. */
async function tras(mensaje, e) {
  const r = resultado(e);
  const actor = await fromUuid(e.actorUuid);
  const ctx = contexto();
  const pj = actor?.type === "personaje";
  // Crítico: +1 proeza (2 con «Seguro de sí mismo»), salvo si se repite con proeza (cap. 3).
  if (pj && r.critico && e.tipo === "habilidad" && !e.premiado && ctx.proezaCritico && e.repeticion !== "proeza") {
    const puntos = n(actor.fx?.critProezas, 1);
    await actor.ganarProeza(puntos, { silencioso: true });
    e.premiado = puntos;
    e.notas.push(`Crítico: +${puntos} ${puntos > 1 ? "proezas" : "proeza"}`);
  }
  // Resistencias: fallar deja inconsciente o en crisis; una repetición con éxito lo revierte.
  if (ES_RESISTENCIA(e.tipo) && actor) {
    const campo = e.tipo === "resistenciaFisica" ? "inconsciente" : "crisisMental";
    if (!r.exito && !e.fallado) {
      await actor.update({ [`system.estado.${campo}`]: true });
      e.fallado = campo;
      if (campo === "crisisMental") {
        const d = R.duracionCrisis(e.perdida ?? 1);
        e.notas.push(`Crisis de locura temporal: 1D ${d.unidad} (el DJ decide qué le ocurre).`);
      } else e.notas.push("Cae inconsciente: el DJ decide cuándo despierta.");
    } else if (r.exito && e.fallado) {
      await actor.update({ [`system.estado.${e.fallado}`]: false });
      e.notas = e.notas.filter(t => !t.startsWith("Crisis de locura") && !t.startsWith("Cae inconsciente"));
      e.fallado = null;
    }
    if (ctx.opciones.criticosResistencia) {
      const esp = R.resistenciaEspecial(e.caras);
      if (esp && !e.especial) {
        e.especial = esp;
        e.notas.push(await efectoEspecialResistencia(actor, e.tipo, esp));
      }
    }
  }
  if (e.ataque && r.exito && !e.danoId) e.danoId = (await crearDano(e, r, actor))?.id ?? null;
  else if (e.ataque && !r.exito && e.danoId) await cancelarDano(e);
  await guardar(mensaje, e);
}

/** Opcional del SRD: críticos y pifias en Resistencia. */
async function efectoEspecialResistencia(actor, tipo, esp) {
  const fisica = tipo === "resistenciaFisica";
  if (esp === "critico2") { fisica ? await actor.curar(1) : await actor.recuperarEstabilidad(1); return `Doble 6: recupera 1 punto de ${fisica ? "Salud" : "Estabilidad"}.`; }
  if (esp === "critico3") { const x = (await new Roll("1d6").evaluate()).total; fisica ? await actor.curar(x) : await actor.recuperarEstabilidad(x); return `Triple 6: recupera ${x} puntos de ${fisica ? "Salud" : "Estabilidad"}.`; }
  if (esp === "pifia2") { fisica ? await actor.aplicarDano(1, { sinUmbrales: true }) : await actor.perderEstabilidad(1, { sinUmbrales: true }); return `Doble 1: pierde 1 punto más de ${fisica ? "Salud" : "Estabilidad"}.`; }
  if (fisica) { await actor.update({ "system.salud.valor": 0, "system.estado.muerto": true }); return "Triple 1: parada cardíaca, muere."; }
  await actor.update({ "system.estabilidad.valor": 0, "system.estado.crisisMental": true });
  return "Triple 1: colapso nervioso sistémico, enloquece para siempre.";
}

/**
 * Lanza los dados y publica la tarjeta.
 * `dados` ya es el número real (tope y penalizadores incluidos); `opciones.dadoProeza` marca que el último dado viene de una proeza.
 */
export async function lanzar({ actor, token, clave = "", etiqueta, dados, atributo = 0, bonus = 0, dificultad = 9, tipo = "habilidad", flavor = "", notas = [], ataque = null, umbral = false, perdida = 0, opciones = {} }) {
  const cuantos = Math.max(0, Math.min(14, dados));
  const roll = cuantos ? await new Roll(`${cuantos}d6`).evaluate() : null;
  const caras = roll ? roll.dice[0].results.map(r => r.result) : [];
  const fx = actor.fx ?? {};
  const estado = {
    actorUuid: actor.uuid, tokenUuid: token?.document?.uuid ?? "", etiqueta, clave, flavor, tipo, dificultad, atributo, bonus,
    dados: cuantos, caras, marcas: caras.map(() => "n"), notas: [...notas], repeticion: null, defecto: null, sinCritico: false,
    critUnSeis: tipo === "habilidad" && aplica(fx.critUnSeis, clave), ataque, danoId: null, premiado: 0, umbral, perdida, fallado: null, especial: null
  };
  // «Al saber le llaman suerte»: si el dado de la proeza saca un 6, se recupera la proeza.
  if (opciones.dadoProeza && fx.proezaRecupera && caras.length && caras[caras.length - 1] === 6) {
    await actor.ganarProeza(1, { silencioso: true });
    estado.notas.push("«Al saber le llaman suerte»: recuperas la proeza.");
  }
  const mensaje = await publicar(vistaTirada(estado), { actor, token, rolls: roll ? [roll] : [], flujo: { tipo: "tirada", estado } });
  await tras(mensaje, estado);
  return { mensaje, estado, resultado: resultado(estado) };
}

async function elegirDados(e, titulo) {
  const datos = await pedirDatos({
    titulo, intro: "<p>Marca los dados que quieres volver a tirar. Los demás se quedan como están.</p>",
    filas: e.caras.map((v, i) => ({ nombre: `d${i}`, tipo: "check", etiqueta: `Dado ${i + 1}: ${v}`, valor: v < 5 })),
    ok: "Repetir"
  });
  return datos ? e.caras.map((_, i) => i).filter(i => datos[`d${i}`]) : null;
}

async function repetirDados(mensaje, e, titulo, nota, marca) {
  const elegidos = await elegirDados(e, titulo);
  if (!elegidos?.length) return false;
  const nuevas = await rolar(elegidos.length);
  elegidos.forEach((idx, i) => { e.caras[idx] = nuevas[i]; });
  e.marcas = e.caras.map((_, i) => (elegidos.includes(i) ? "r" : "k"));
  e.repeticion = marca;
  e.sinCritico = true;       // cap. 3: la repetición con proeza nunca da crítico
  e.notas.push(nota);
  await tras(mensaje, e);
  return true;
}

registrarAccion("proeza", async ({ mensaje, estado: e }) => {
  const actor = await fromUuid(e.actorUuid);
  const cj = contexto().conjunto;
  if (resultado(e).exito || e.repeticion || e.defecto) return ui.notifications.warn(`Esta tirada ya no se puede repetir con ${cj.recursoUno}.`);
  if (!actor.puedeGastarProeza(1)) return;
  const elegidos = await elegirDados(e, `Repetir con ${cj.recursoUno}: ${e.etiqueta}`);
  if (!elegidos?.length) return;
  await actor.gastarProeza(1);
  const nuevas = await rolar(elegidos.length);
  elegidos.forEach((idx, i) => { e.caras[idx] = nuevas[i]; });
  e.marcas = e.caras.map((_, i) => (elegidos.includes(i) ? "r" : "k"));
  e.repeticion = "proeza";
  e.sinCritico = true;
  e.notas.push(`Repetida con 1 ${cj.recursoUno} (sin críticos)`);
  await tras(mensaje, e);
});

registrarAccion("gratis", async ({ mensaje, estado: e }) => {
  const actor = await fromUuid(e.actorUuid);
  const g = repeticionGratisDisponible(actor, e);
  if (!g || resultado(e).exito) return ui.notifications.warn("Esta tirada ya no se puede repetir gratis.");
  const ok = await repetirDados(mensaje, e, `Repetir gratis: ${e.etiqueta}`, "Repetida gratis por un talento (sin críticos)", "gratis");
  if (ok && g.usos) await actor.update({ "system.usosTalentos.repeticiones": n(actor.system.usosTalentos?.repeticiones) + 1 });
});

const defecto = grave => async ({ mensaje, estado: e }) => {
  const actor = await fromUuid(e.actorUuid);
  const ctx = contexto();
  if (!grave && actor.system.defectos.leveUsado) return ui.notifications.warn(`${ctx.conjunto.defectoLeve}: ya se activó en esta sesión.`);
  const r = resultado(e);
  if (r.critico && !ctx.edicion.criticoRepetibleConDefecto) return ui.notifications.warn("En la Edición Revisada un defecto no puede anular un crítico.");
  const cuantos = grave ? Math.max(0, e.dados - 1) : e.dados;
  if (e.premiado) { await actor.gastarProeza(e.premiado, { silencioso: true }); e.notas.push(`Se retira la proeza del crítico (${e.premiado}).`); }
  e.caras = await rolar(cuantos);
  e.dados = cuantos;
  e.marcas = e.caras.map(() => "r");
  e.repeticion = "defecto";
  e.defecto = grave ? "grave" : "leve";
  e.sinCritico = false;
  e.premiado = 0;
  if (grave) {
    await actor.ganarProeza(1, { silencioso: true });
    e.notas.push(`${ctx.conjunto.defectoGrave}: se repite con 1D menos y el DJ entrega 1 ${ctx.conjunto.recursoUno}.`);
  } else {
    await actor.update({ "system.defectos.leveUsado": true });
    e.notas.push(`${ctx.conjunto.defectoLeve}: se repite tal cual, sin ${ctx.conjunto.recursoUno} a cambio.`);
  }
  await tras(mensaje, e);
};
registrarAccion("defecto-grave", defecto(true));
registrarAccion("defecto-leve", defecto(false));

/* ------------------------------------------------------------------ */
/* Daño y curación pendientes                                         */
/* ------------------------------------------------------------------ */

const ESTADOS = { pendiente: "Pendiente", aplicado: "Aplicado", cancelado: "Cancelado", evitado: "Evitado", resistido: "Resistido", espera: "Sin tirar" };

export function vistaEfecto(s) {
  const cura = s.clase === "cura";
  const botones = [];
  const uuid = s.objetivoUuid;
  if (s.estado === "pendiente") {
    if (s.defensa) botones.push({ accion: "defensa", etiqueta: `Defensa activa (${s.defensa.dificultad})`, icono: "fa-solid fa-shield-halved", quien: "dueno", uuid });
    if (s.critico && s.puedeIgnorar) botones.push({ accion: "ignorar-critico", etiqueta: "Crítico a fallo (gasta todas las proezas)", icono: "fa-solid fa-star", quien: "dueno", uuid });
    botones.push({ accion: "aplicar", etiqueta: cura ? "Aplicar curación" : s.noquear ? "Aplicar y tirar Resistencia" : "Aplicar daño", icono: cura ? "fa-solid fa-heart" : "fa-solid fa-burst", quien: "dueno", uuid, principal: true });
    botones.push({ accion: "cancelar", etiqueta: "Cancelar", quien: "dueno", uuid });
  }
  const lineas = [];
  if (s.detalle) lineas.push({ texto: esc(s.detalle), icono: "fa-solid fa-calculator" });
  for (const t of s.lineas ?? []) lineas.push({ texto: esc(t) });
  if (s.texto) lineas.push({ texto: esc(s.texto), icono: "fa-solid fa-circle-info" });
  const recurso = s.recurso === "estabilidad" ? "Estabilidad" : "Salud";
  return {
    tono: cura ? "cura" : s.estado === "evitado" || s.estado === "resistido" ? "exito" : "dano",
    icono: cura ? "fa-solid fa-heart-pulse" : s.clase === "panico" ? "fa-solid fa-ghost" : "fa-solid fa-burst",
    etiqueta: s.etiqueta, subtitulo: s.objetivo, resultado: ESTADOS[s.estado],
    titulo: `${s.cantidad} de ${cura ? "curación" : recurso === "Salud" ? "Salud" : "Estabilidad"}`, lineas, botones
  };
}
registrarVista("efecto", vistaEfecto);

/** Publica una tarjeta de daño/curación pendiente. `s` ya trae objetivo y cantidad. */
export function publicarEfecto(s, op = {}) {
  const estado = { estado: "pendiente", lineas: [], recurso: "salud", ...s };
  return publicar(vistaEfecto(estado), { ...op, flujo: { tipo: "efecto", estado } });
}

async function tirarExplosivos(cuantos, explotaCon = 6) {
  if (cuantos <= 0) return { total: 0, roll: null };
  const roll = await new Roll(`${cuantos}d6x>=${explotaCon}`).evaluate();
  await mostrar(roll);
  return { total: roll.total, roll };
}

async function crearDano(e, r, actor) {
  const a = e.ataque;
  const objetivo = await resolverObjetivo({ tokenUuid: a.tokenUuid, objetivoUuid: a.objetivoUuid });
  const ctx = contexto();
  const rolls = [];
  // Proezas al daño: se gastan ahora que el golpe ha impactado (cap. 3), con el tope de la edición.
  let gastadas = a.proezasDano;
  if (gastadas && actor.type === "personaje") {
    const hay = n(actor.system.proezas.valor);
    gastadas = Math.min(gastadas, hay);
    if (gastadas) await actor.gastarProeza(gastadas);
  } else gastadas = 0;
  const explosivos = await tirarExplosivos(gastadas, a.explotaCon ?? 6);
  if (explosivos.roll) rolls.push(explosivos.roll);
  const apuntar = a.dadosApuntar ? await new Roll(`${a.dadosApuntar}d6`).evaluate() : null;
  if (apuntar) { await mostrar(apuntar); rolls.push(apuntar); }
  const extraDado = a.dadoExtra ? await new Roll(`${a.dadoExtra}d6`).evaluate() : null;
  if (extraDado) { await mostrar(extraDado); rolls.push(extraDado); }
  const extra = explosivos.total + (apuntar?.total ?? 0) + (extraDado?.total ?? 0);
  const armadura = a.armadura ?? n(objetivo?.system?.proteccion?.dano);
  let cantidad = R.danoImpacto({ fijo: a.fijo, extra, critico: r.critico, armadura, edicion: ctx.edicion, dobla: a.dobla ?? "fijo" });
  if (a.noquear) cantidad = R.danoNoquear(cantidad);
  const partes = [`${a.fijo} ${a.formulaFijo ?? "fijo"}`];
  if (explosivos.total) partes.push(`+ ${explosivos.total} (${gastadas} ${gastadas > 1 ? "proezas" : "proeza"}, explotan)`);
  if (apuntar?.total) partes.push(`+ ${apuntar.total} (apuntar)`);
  if (extraDado?.total) partes.push(`+ ${extraDado.total} (talento)`);
  if (armadura) partes.push(r.critico && ctx.edicion.criticoIgnoraArmadura ? "· ignora armadura" : `− ${armadura} (armadura)`);
  if (r.critico) partes.push("· crítico: daño fijo ×2");
  if (a.noquear) partes.push("· noquear: mitad");
  const s = {
    clase: "dano", objetivoUuid: a.objetivoUuid, tokenUuid: a.tokenUuid, objetivo: a.objetivoNombre,
    cantidad, original: cantidad, etiqueta: a.etiqueta, fuego: a.fuego, habilidad: a.habilidad, noquear: a.noquear, critico: r.critico,
    puedeIgnorar: r.critico && objetivo?.type === "personaje" && ctx.conjunto.id === "srd",
    detalle: partes.join(" "), defensa: a.defensa ?? null
  };
  return publicarEfecto(s, { actor, rolls });
}

async function cancelarDano(e) {
  const m = game.messages.get(e.danoId);
  const s = m?.getFlag(ID, "estado");
  if (s?.estado === "pendiente") await guardar(m, { ...s, estado: "cancelado", texto: "La tirada de ataque ya no impacta." });
  e.danoId = null;
}

registrarAccion("aplicar", async ({ mensaje, estado: s }) => {
  if (s.estado !== "pendiente") return;
  const objetivo = await resolverObjetivo(s);
  if (!objetivo) return ui.notifications.warn("No encuentro al objetivo.");
  if (s.clase === "cura") {
    if (s.recurso === "estabilidad") await objetivo.recuperarEstabilidad(s.cantidad); else await objetivo.curar(s.cantidad);
  } else if (s.clase === "panico") await objetivo.perderEstabilidad(s.cantidad);
  else await objetivo.aplicarDano(s.cantidad);
  s.estado = "aplicado";
  await guardar(mensaje, s);
  if (s.noquear && objetivo.system.salud.valor > 0) {
    // Cap. 5 (noquear): tirada extra de Resistencia física con 1D menos, es decir, con 2D.
    await objetivo.tirarResistencia("fisica", { dadosMenos: 1, motivo: "noqueado", dialogo: false });
  }
});

registrarAccion("cancelar", async ({ mensaje, estado: s }) => { s.estado = "cancelado"; await guardar(mensaje, s); });

registrarAccion("ignorar-critico", async ({ mensaje, estado: s }) => {
  const objetivo = await resolverObjetivo(s);
  if (!objetivo || objetivo.type !== "personaje") return;
  const hay = n(objetivo.system.proezas.valor);
  if (hay < 1) return ui.notifications.warn(`${objetivo.name} no tiene proezas que gastar.`);
  await objetivo.gastarProeza(hay);
  s.estado = "evitado";
  s.texto = `${objetivo.name} gasta todas sus proezas (${hay}) y el crítico queda en un fallo simple. Que describa su reacción.`;
  await guardar(mensaje, s);
});

registrarAccion("defensa", async ({ mensaje, estado: s }) => {
  const objetivo = await resolverObjetivo(s);
  const res = await objetivo?.tirarHabilidad("atletismo", { dificultad: s.defensa.dificultad, notas: ["Defensa activa"], dialogo: true });
  if (!res) return;
  if (res.resultado.exito) {
    s.estado = "evitado";
    s.texto = `${objetivo.name} se defiende activamente y evita el daño.`;
  } else if (res.resultado.pifia) {
    s.cantidad = s.original * 2;
    s.texto = `${objetivo.name} pifia la defensa activa: el daño se dobla a ${s.cantidad}.`;
  } else s.texto = `${objetivo.name} falla la defensa activa; el daño sigue pendiente.`;
  s.defensa = null;
  await guardar(mensaje, s);
});

/* ------------------------------------------------------------------ */
/* Umbrales de Salud y de Estabilidad                                 */
/* ------------------------------------------------------------------ */

function vistaUmbrales(s) {
  const fisica = s.clase === "salud";
  const cj = contexto().conjunto;
  const nombreRes = fisica ? cj.rf : cj.rm;
  const botones = s.umbrales.filter(u => !s.tirados.includes(u) && !s.fallo).map(u => ({
    accion: "umbral", etiqueta: `Tirar ${nombreRes} · umbral ${u}`, icono: fisica ? "fa-solid fa-heart-pulse" : "fa-solid fa-brain", quien: "dueno", uuid: s.actorUuid, datos: { umbral: u }, principal: true
  }));
  return {
    tono: s.fallo ? "pifia" : "aviso", icono: fisica ? "fa-solid fa-heart-crack" : "fa-solid fa-brain", etiqueta: `Umbral de ${fisica ? "Salud" : "Estabilidad"}`, subtitulo: s.nombre,
    resultado: s.fallo ? (fisica ? (cj.id === "srd" ? "Cae inconsciente" : "Ha estirado la pata") : "Crisis temporal") : s.tirados.length === s.umbrales.length ? "Superados" : "Hay que tirar",
    lineas: [{ texto: `Cruza por primera vez: <strong>${s.umbrales.join(", ")}</strong>. Una tirada de ${esc(nombreRes)} por cada umbral; ${fisica ? "fallar deja inconsciente" : "fallar provoca una crisis de locura temporal"}.` }],
    botones
  };
}
registrarVista("umbrales", vistaUmbrales);

export const publicarUmbrales = (actor, umbrales, clase = "salud", perdida = 0) => {
  const estado = { actorUuid: actor.uuid, nombre: actor.name, clase, umbrales, tirados: [], fallo: null, perdida };
  return publicar(vistaUmbrales(estado), { actor, flujo: { tipo: "umbrales", estado } });
};

registrarAccion("umbral", async ({ mensaje, estado: s, datos }) => {
  const u = Number(datos.umbral);
  if (s.tirados.includes(u)) return;
  const actor = await fromUuid(s.actorUuid);
  const res = await actor.tirarResistencia(s.clase === "salud" ? "fisica" : "mental", { motivo: `umbral ${u}`, umbral: true, perdida: s.perdida });
  if (!res) return;
  s.tirados.push(u);
  if (!res.resultado.exito) s.fallo = u;
  await guardar(mensaje, s);
});

/* ------------------------------------------------------------------ */
/* Pánico (cap. 6) y miedo de YayoSystem                              */
/* ------------------------------------------------------------------ */

function vistaPanico(s) {
  const botones = [];
  const pierde = s.pierde === "salud" ? "Salud" : "Estabilidad";
  if (s.estado === "espera") {
    botones.push({ accion: "panico-reforzar", etiqueta: `Reforzar ${s.etiquetaAplomo} (proezas)`, icono: "fa-solid fa-star", quien: "dueno", uuid: s.objetivoUuid });
    botones.push({ accion: "panico-tirar", etiqueta: "Tirar pánico", icono: "fa-solid fa-dice", quien: "gm", principal: true });
  }
  if (s.estado === "pendiente") botones.push({ accion: "panico-aplicar", etiqueta: `Aplicar pérdida de ${pierde}`, icono: "fa-solid fa-ghost", quien: "dueno", uuid: s.objetivoUuid, principal: true });
  const lineas = [];
  if (s.habituado) lineas.push({ texto: "Habituado por su profesión: +3 al Aplomo." });
  if (s.proezas) lineas.push({ texto: `${s.proezas} ${s.proezas > 1 ? "proezas gastadas" : "proeza gastada"}: +${R.refuerzoFijo(s.proezas)} a ${esc(s.etiquetaAplomo)}.` });
  if (s.texto) lineas.push({ texto: esc(s.texto) });
  return {
    tono: s.estado === "resistido" ? "exito" : s.estado === "espera" ? "aviso" : "pifia", icono: "fa-solid fa-ghost", etiqueta: "Pánico", subtitulo: s.objetivo,
    resultado: { espera: "Sin tirar", resistido: "Resistido", pendiente: "Pánico", aplicado: "Aplicado" }[s.estado],
    titulo: s.estado === "espera" ? `${s.dados}D6 contra ${s.etiquetaAplomo} ${s.aplomoTotal}` : undefined,
    conTotal: s.total !== undefined, dados: s.caras?.map(v => ({ v, c: "n" })), total: s.total, dificultad: s.aplomoTotal, lineas, botones
  };
}
registrarVista("panico", vistaPanico);

/** El DJ tira 1-7D contra el Aplomo de cada objetivo. `opciones`: dados, habituado, repeticiones. */
export async function lanzarPanico(objetivos, { dados, habituado = false, repeticiones = 0 }) {
  const ctx = contexto();
  const cj = ctx.conjunto;
  const reducidos = ctx.opciones.habituarse ? R.gravedadHabituada(dados, repeticiones) : dados;
  if (!reducidos) return ui.notifications.info("Se han acostumbrado al horror: ya no hace falta tirar.");
  for (const o of objetivos) {
    const etiqueta = cj.fijos.aplomo;
    const estado = {
      estado: "espera", objetivoUuid: o.uuid, objetivo: o.name, dados: reducidos, habituado, proezas: 0, etiquetaAplomo: etiqueta,
      aplomoBase: o.valorFijo("aplomo"), aplomoTotal: R.aplomoPanico({ aplomo: o.valorFijo("aplomo"), habituado }),
      pierde: cj.miedo?.pierde ?? "estabilidad", ampliado: ctx.opciones.panicoAmpliado
    };
    await publicar(vistaPanico(estado), { alias: "DJ", flujo: { tipo: "panico", estado } });
  }
}

registrarAccion("panico-reforzar", async ({ mensaje, estado: s }) => {
  const o = await fromUuid(s.objetivoUuid);
  const cj = contexto().conjunto;
  const d = await pedirDatos({
    titulo: `Reforzar ${s.etiquetaAplomo}: ${o.name}`, intro: "<p>Cada proeza suma +3 al valor. Se declara antes de la tirada.</p>",
    filas: [{ nombre: "puntos", tipo: "num", etiqueta: `${cj.recurso} (tiene ${o.system.proezas.valor})`, valor: 1, min: 1 }], ok: "Gastar"
  });
  const puntos = n(d?.puntos);
  if (puntos < 1 || !(await o.gastarProeza(puntos))) return;
  s.proezas += puntos;
  s.aplomoTotal = R.aplomoPanico({ aplomo: s.aplomoBase, habituado: s.habituado, proezas: s.proezas });
  await guardar(mensaje, s);
});

registrarAccion("panico-tirar", async ({ mensaje, estado: s }) => {
  const o = await fromUuid(s.objetivoUuid);
  const roll = await new Roll(`${s.dados}d6`).evaluate();
  await mostrar(roll);
  s.caras = roll.dice[0].results.map(r => r.result);
  s.total = roll.total;
  const fx = o?.fx ?? {};
  if (fx.panico?.sinMayor && s.caras.length > 1) {
    // «Curado de espanto»: no se suma el dado de mayor valor.
    s.total -= Math.max(...s.caras);
    s.texto = "«Curado de espanto»: no se suma el dado de mayor valor.";
  }
  const cae = s.total >= s.aplomoTotal;
  s.cantidad = cae ? R.perdidaPanico(s.dados, s.ampliado) : 0;
  s.estado = cae ? "pendiente" : "resistido";
  s.texto = [s.texto, cae ? `${s.total} iguala o supera ${s.aplomoTotal}: pierde ${s.cantidad} de ${s.pierde === "salud" ? "Salud" : "Estabilidad"}.` : `${s.total} no llega a ${s.aplomoTotal}: aguanta el susto.`].filter(Boolean).join(" ");
  await o?.update({ "system.combate.refuerzoAplomo": 0 });
  await guardar(mensaje, s);
});

registrarAccion("panico-aplicar", async ({ mensaje, estado: s }) => {
  const o = await fromUuid(s.objetivoUuid);
  if (s.estado !== "pendiente" || !o) return;
  if (s.pierde === "salud") await o.aplicarDano(s.cantidad); else await o.perderEstabilidad(s.cantidad);
  s.estado = "aplicado";
  await guardar(mensaje, s);
});

/* ------------------------------------------------------------------ */
/* Persecuciones (cap. 6)                                             */
/* ------------------------------------------------------------------ */

const NOMBRES_DISTANCIA = ["¡Capturado!", "Corta", "Media", "Larga", "Muy larga", "¡Ha huido!"];
const nombreDistancia = d => NOMBRES_DISTANCIA[Math.max(0, Math.min(5, d + 1))];

function vistaPersecucion(s) {
  const pips = R.DISTANCIAS.map((_, i) => (i === s.distancia ? "●" : "○")).join(" ");
  const botones = [];
  if (!s.fin) {
    botones.push({ accion: "turno-persecucion", etiqueta: "Tirar este turno", icono: "fa-solid fa-person-running", quien: "dueno", uuid: s.actorUuid, principal: true });
    if (s.suceso?.pendiente) botones.push({ accion: "suceso-persecucion", etiqueta: `Resolver: ${s.suceso.titulo}`, icono: "fa-solid fa-triangle-exclamation", quien: "dueno", uuid: s.actorUuid });
  }
  const dist = s.fin ? nombreDistancia(s.distancia) : R.DISTANCIAS[s.distancia];
  const ultimo = s.historial.slice(-5);
  return {
    tono: s.fin ? (s.fin === (s.perseguidor ? "captura" : "huida") ? "exito" : "pifia") : "aviso", icono: "fa-solid fa-person-running",
    etiqueta: "Persecución", subtitulo: `${s.nombre} ${s.perseguidor ? "persigue a" : "huye de"} ${s.objetivo}`,
    resultado: s.fin ? dist : `Distancia ${dist}`, titulo: `Distancia: ${pips}`,
    lineas: [
      { texto: `Cada turno se tira Atletismo (a pie) o Conducir (con montura o vehículo) contra la Agilidad ${s.agilidad} del otro. ${s.perseguidor ? "Bajar de corta es capturar." : "Pasar de muy larga es escapar."}` },
      { texto: `Disparos: ${R.disparoEnPersecucion(s.distancia).modo === "normal" ? "dificultad normal" : R.disparoEnPersecucion(s.distancia).modo === "apuntado" ? "hay que apuntar con 1D (no suma daño)" : "solo con un crítico"}.` },
      ...ultimo.map(h => ({ texto: esc(h) }))
    ],
    botones
  };
}
registrarVista("persecucion", vistaPersecucion);

export const publicarPersecucion = (actor, { objetivo, agilidad, perseguidor }) => {
  const estado = { actorUuid: actor.uuid, nombre: actor.name, objetivo, agilidad, perseguidor, distancia: 1, fin: null, historial: [], suceso: null, bajaAgilidad: 0 };
  return publicar(vistaPersecucion(estado), { actor, flujo: { tipo: "persecucion", estado } });
};

registrarAccion("turno-persecucion", async ({ mensaje, estado: s }) => {
  const actor = await fromUuid(s.actorUuid);
  const datos = await pedirDatos({
    titulo: "Turno de persecución",
    filas: [
      { nombre: "clave", tipo: "sel", etiqueta: "Habilidad", valor: "atletismo", opciones: [{ valor: "atletismo", etiqueta: "Atletismo (a pie, bici, a rastras)" }, { valor: "conducir", etiqueta: "Conducir (montura o vehículo)" }] },
      { nombre: "dificultad", tipo: "num", etiqueta: `Agilidad del otro${s.bajaAgilidad ? ` (−${s.bajaAgilidad} por un suceso)` : ""}`, valor: Math.max(1, s.agilidad - s.bajaAgilidad), min: 1, max: 40 }
    ],
    ok: "Tirar"
  });
  if (!datos) return;
  s.agilidad = datos.dificultad + s.bajaAgilidad;
  const res = await actor.tirarHabilidad(datos.clave, { dificultad: datos.dificultad, dialogo: true });
  if (!res) return;
  const { exito, critico, pifia } = res.resultado;
  const mov = R.moverPersecucion({ distancia: s.distancia, perseguidor: s.perseguidor, exito, critico });
  s.distancia = mov.distancia;
  s.fin = mov.fin;
  s.bajaAgilidad = 0;
  s.historial.push(`Turno ${s.historial.filter(h => h.startsWith("Turno")).length + 1}: ${critico ? "crítico, mueve una distancia extra" : pifia ? "pifia: accidente (el DJ decide la gravedad y 1-7D de daño; el vehículo queda siniestrado)" : exito ? "éxito" : "fallo"} → ${s.fin ? nombreDistancia(s.distancia) : R.DISTANCIAS[s.distancia]}.`);
  if (!s.fin) {
    // Al final de cada turno, 2D en la tabla de sucesos inesperados.
    const dos = await new Roll("2d6").evaluate();
    await mostrar(dos);
    const suceso = R.sucesoDe(dos.total);
    s.suceso = { ...suceso, total: dos.total, pendiente: Boolean(suceso.dificultad || suceso.clave === "oponente" || suceso.ventaja) };
    s.historial.push(`Suceso (${dos.total}): ${suceso.titulo}. ${suceso.texto}`);
  } else s.suceso = null;
  await guardar(mensaje, s);
});

registrarAccion("suceso-persecucion", async ({ mensaje, estado: s }) => {
  const actor = await fromUuid(s.actorUuid);
  const e = s.suceso;
  if (!e?.pendiente) return;
  if (e.dificultad) {
    const res = await actor.tirarHabilidad("atletismo", { dificultad: e.dificultad, dialogo: true, notas: [e.titulo] });
    if (!res) return;
    const { exito, critico, pifia } = res.resultado;
    if (critico) { const m = R.moverPersecucion({ distancia: s.distancia, perseguidor: s.perseguidor, exito: true, critico: false }); s.distancia = m.distancia; s.fin = m.fin; }
    else if (!exito) { const m = R.moverPersecucion({ distancia: s.distancia, perseguidor: s.perseguidor, exito: false }); s.distancia = m.distancia; s.fin = m.fin; }
    s.historial.push(`${e.titulo}: ${critico ? "crítico, gana una distancia" : pifia ? "pifia: accidente" : exito ? "lo supera" : "falla y pierde una distancia"} → ${s.fin ? nombreDistancia(s.distancia) : R.DISTANCIAS[s.distancia]}.`);
  } else if (e.clave === "oponente") {
    const ataque = await new Roll("3d6").evaluate();
    await mostrar(ataque);
    const agil = actor.valorFijo("agilidad");
    const impacta = ataque.total >= agil;
    s.historial.push(`Oponente adicional: 3D = ${ataque.total} contra Agilidad ${agil}: ${impacta ? "impacta y causa 6 puntos de daño" : "falla"}.`);
    if (impacta) await actor.aplicarDano(6);
  } else if (e.ventaja) {
    const baja = e.ventaja === "1" ? 1 : (await new Roll(e.ventaja).evaluate()).total;
    s.bajaAgilidad = baja;
    s.historial.push(`Ventaja: la Agilidad del otro baja ${baja} el próximo turno.`);
  }
  s.suceso = null;
  await guardar(mensaje, s);
});

/* ------------------------------------------------------------------ */
/* Tortura (cap. 6, opcional)                                         */
/* ------------------------------------------------------------------ */

/** Dos tiradas independientes (Conversación e Intimidación) contra el Aplomo de la víctima. */
export async function resolverTortura(torturador, victima) {
  const ap = victima.valorFijo("aplomo");
  const a = await torturador.tirarHabilidad("conversacion", { dificultad: ap, dialogo: true, notas: ["Tortura: Conversación"] });
  if (!a) return null;
  const b = await torturador.tirarHabilidad("intimidacion", { dificultad: ap, dialogo: true, notas: ["Tortura: Intimidación"] });
  if (!b) return null;
  const r = R.resolverTortura({ conversacion: a.resultado, intimidacion: b.resultado });
  const lineas = [];
  if (r.automatico) lineas.push({ texto: "Un crítico: la víctima hace o revela todo lo que se le pide, sin más pruebas." });
  else if (r.resistencia2D) lineas.push({ texto: "Ambas tiradas salen: la víctima debe superar una Resistencia física con solo 2D; si falla, habla o hace lo que se le pide." });
  else lineas.push({ texto: `No quiebra su voluntad. La víctima pierde ${r.perdida} ${r.perdida > 1 ? "puntos" : "punto"} de Salud (1 por fallar Conversación, 2 por fallar Intimidación). Se puede repetir cada hora.` });
  await publicar({ tono: r.automatico || r.resistencia2D ? "exito" : "aviso", icono: "fa-solid fa-hand-fist", etiqueta: "Tortura", subtitulo: `${torturador.name} → ${victima.name}`, lineas }, { actor: torturador });
  if (r.perdida) await victima.aplicarDano(r.perdida);
  if (r.resistencia2D) await victima.tirarResistencia("fisica", { dadosMenos: 1, motivo: "tortura", dialogo: false });
  return r;
}

/* ------------------------------------------------------------------ */
/* Duelos (hack opcional)                                             */
/* ------------------------------------------------------------------ */

function vistaDuelo(s) {
  const botones = s.fin ? [] : s.duelistas.flatMap((d, i) => [
    { accion: "duelo-ceder", etiqueta: `${d.nombre} cede ventaja`, icono: "fa-solid fa-shield", quien: "gm", datos: { i } },
    { accion: "duelo-ganar", etiqueta: `${d.nombre} gana ventaja`, icono: "fa-solid fa-arrow-up", quien: "gm", datos: { i } }
  ]);
  return {
    tono: s.fin ? "exito" : "aviso", icono: "fa-solid fa-khanda", etiqueta: "Duelo", subtitulo: s.duelistas.map(d => d.nombre).join(" contra "),
    resultado: s.fin ?? "En curso",
    lineas: [
      ...s.duelistas.map(d => ({ texto: `<strong>${esc(d.nombre)}</strong>: ${esc(R.estadoDuelo(d.ventaja))} (${d.ventaja})` })),
      { texto: "Al ser impactado, el jugador elige entre sufrir el daño o ceder un nivel de ventaja. Se gana ventaja con un crítico o si no te atacan en el turno. Con 0 queda derrotado." }
    ],
    botones
  };
}
registrarVista("duelo", vistaDuelo);

export const publicarDuelo = (a, b) => {
  const estado = { duelistas: [{ nombre: a.name, ventaja: 3 }, { nombre: b.name, ventaja: 3 }], fin: null };
  return publicar(vistaDuelo(estado), { alias: "DJ", flujo: { tipo: "duelo", estado } });
};
const cambioVentaja = delta => async ({ mensaje, estado: s, datos }) => {
  const d = s.duelistas[Number(datos.i)];
  d.ventaja = Math.max(0, Math.min(4, d.ventaja + delta));
  if (d.ventaja === 0) s.fin = `${d.nombre} derrotado`;
  await guardar(mensaje, s);
};
registrarAccion("duelo-ceder", cambioVentaja(-1));
registrarAccion("duelo-ganar", cambioVentaja(1));

export { mostrar, rolar, tirarExplosivos };
