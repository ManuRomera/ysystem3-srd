/**
 * Combate (SRD cap. 5): iniciativa 1D6 fijo + DES + INT (YayoSystem: PRE + arma) una sola vez al empezar;
 * desempate por DES, INT, PER, Agilidad y edad; quien es cogido por sorpresa pierde la iniciativa toda la pelea;
 * un 6 en el dado da una acción extra en el primer turno a un solo personaje (el de mayor iniciativa entre quienes sacaron 6);
 * defenderse completamente sube una posición. Los efectos de un turno (refuerzos, defensa completa) caducan al cambiar de asalto.
 */
import { ID } from "./config.mjs";
import * as R from "./reglas.mjs";
import { publicar } from "./chat.mjs";

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export class CombatanteYsystem3 extends Combatant {
  getInitiativeRoll(formula) {
    const a = this.actor;
    if (!a?.system?.efectivos) return super.getInitiativeRoll(formula);
    this._sorprendido = Boolean(a.system.combate.sorprendido);
    if (this._sorprendido) return (this._ini = Roll.create("-99"));
    const at = a.system.efectivos.atributos;
    const fraccion = R.desempateIniciativa({ des: at.des, int: at.int, per: at.per, agil: a.valorFijo("agilidad"), edad: parseInt(a.system.datos?.edad) || 99 });
    const dados = a.fx?.iniciativa2D ? "2d6kh" : "1d6";
    return (this._ini = Roll.create(`${dados} + ${a.valorIniciativa} + ${fraccion.toFixed(8)}`));
  }
}

export class CombateYsystem3 extends Combat {
  /** Tras tirar, un 6 marca la acción extra del primer turno; solo la conserva el de mayor iniciativa. */
  async rollInitiative(ids, opciones) {
    const res = await super.rollInitiative(ids, opciones);
    for (const id of typeof ids === "string" ? [ids] : ids) {
      const c = this.combatants.get(id);
      if (!c || c._sorprendido) continue;
      const dados = c._ini?.dice?.[0]?.results?.filter(r => r.active !== false).map(r => r.result) ?? [];
      await c.setFlag(ID, "saco6", dados.includes(6));
    }
    const con6 = this.combatants.filter(c => c.getFlag(ID, "saco6") && c.initiative !== null && c.initiative > -50);
    const ganador = con6.sort((a, b) => b.initiative - a.initiative)[0];
    for (const c of this.combatants) {
      const debe = c.id === ganador?.id;
      if (Boolean(c.getFlag(ID, "accionExtra")) !== debe) await c.setFlag(ID, "accionExtra", debe);
    }
    if (ganador && (typeof ids === "string" ? [ids] : ids).some(id => id === ganador.id)) {
      await publicar({ tono: "exito", icono: "fa-solid fa-bolt", etiqueta: "Iniciativa", titulo: "¡Un 6!", texto: `${ganador.name} actúa dos veces en el primer turno: la acción extra va antes que ninguna otra, sea cual sea el orden.` }, { actor: ganador.actor });
    }
    return res;
  }
}

const RESET_ASALTO = {
  "system.combate.defensaCompleta": 0, "system.combate.refuerzoAgilidad": 0, "system.combate.refuerzoAplomo": 0, "system.combate.refuerzoPerspicacia": 0
};

/** Al cambiar de asalto caducan los refuerzos con proezas y la defensa completa; la sorpresa, tras el primero; la subida de posición se aplica. */
export async function alCambiarAsalto(combate, cambios) {
  if (!game.user.isGM || !("round" in cambios) || cambios.round < 1) return;
  for (const c of combate.combatants) {
    const a = c.actor;
    if (!a?.system?.combate) continue;
    const s = a.system.combate;
    const nuevo = {};
    for (const [k, v] of Object.entries(RESET_ASALTO)) if (n(foundry.utils.getProperty(a, k))) nuevo[k] = v;
    if (s.sorprendido && cambios.round >= 2) nuevo["system.combate.sorprendido"] = false;
    if (c.getFlag(ID, "accionExtra") && cambios.round >= 2) await c.unsetFlag(ID, "accionExtra");
    if (Object.keys(nuevo).length) await a.update(nuevo);
  }
  // Defenderse completamente: asciende una posición para lo que resta de combate.
  const orden = [...combate.combatants].filter(c => c.initiative !== null).sort((a, b) => b.initiative - a.initiative);
  for (const c of orden.filter(x => x.getFlag(ID, "asciende"))) {
    const i = orden.findIndex(x => x.id === c.id);
    if (i > 0) {
      const arriba = orden[i - 1];
      await c.update({ initiative: arriba.initiative + 0.0001 });
      [orden[i - 1], orden[i]] = [orden[i], orden[i - 1]];
    }
    await c.unsetFlag(ID, "asciende");
  }
}

/** Al terminar el combate caducan todos los efectos de combate. */
export async function alTerminarCombate(combate) {
  if (!game.user.isGM) return;
  const limpiar = { ...RESET_ASALTO, "system.combate.sorprendido": false, "system.combate.inmovilizado": false, "system.combate.cobertura": "ninguna", "system.combate.resguardado": false, "system.combate.ignoraPenalizador": false };
  for (const c of combate.combatants) {
    const a = c.actor;
    if (!a?.system?.combate) continue;
    const hay = Object.entries(limpiar).some(([k, v]) => foundry.utils.getProperty(a, k) !== v);
    if (hay) await a.update(limpiar);
  }
}

/** Distintivos en el tracker: acción extra, sorpresa, inmovilizado, defensa completa. */
export function pintarTracker(app, html) {
  const raiz = html instanceof HTMLElement ? html : html[0];
  for (const li of raiz?.querySelectorAll("li.combatant") ?? []) {
    const c = app.viewed?.combatants.get(li.dataset.combatantId);
    if (!c) continue;
    const s = c.actor?.system?.combate;
    const marcas = [];
    if (c.getFlag(ID, "accionExtra")) marcas.push(["fa-bolt", "Acción extra en el primer turno"]);
    if (s?.sorprendido) marcas.push(["fa-eye-slash", "Cogido por sorpresa: sin acción en el primer turno y Agilidad a la mitad"]);
    if (s?.inmovilizado) marcas.push(["fa-hand", "Inmovilizado: Agilidad a la mitad, solo puede zafarse"]);
    if (s?.defensaCompleta) marcas.push(["fa-shield-halved", `Defensa completa: +${s.defensaCompleta} de Agilidad este turno`]);
    if (!marcas.length || li.querySelector(".ys-marcas")) continue;
    const span = document.createElement("span");
    span.className = "ys-marcas";
    span.innerHTML = marcas.map(([i, t]) => `<i class="fa-solid ${i}" data-tooltip="${t}"></i>`).join("");
    li.querySelector(".token-name")?.append(span);
  }
}
