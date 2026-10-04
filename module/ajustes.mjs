/**
 * Ajustes del mundo y «contexto de reglas»: qué variante, conjunto, edición y reglas opcionales rigen ahora.
 * Todo el sistema pregunta aquí; nadie lee `game.settings` por su cuenta. El contexto se cachea y se invalida
 * al cambiar cualquier ajuste del sistema.
 */
import { ID, VARIANTES, REGLAS_OPCIONALES, varianteDe, conjuntoDe } from "./config.mjs";
import { EDICIONES } from "./reglas.mjs";

let cache = null;

export const invalidarContexto = () => { cache = null; };

/** { claveVariante, variante, conjunto, edicion, opciones, poderes, proezaCritico, pulp } */
export function contexto() {
  if (cache) return cache;
  const g = k => game.settings.get(ID, k);
  const claveVariante = VARIANTES[g("variant")] ? g("variant") : "base";
  const variante = varianteDe(claveVariante);
  const conjunto = conjuntoDe(variante.conjunto);
  const edicion = conjunto.id === "srd" ? (EDICIONES[g("edicion")] ?? EDICIONES.y3) : EDICIONES.y3;
  const opciones = {};
  for (const k of Object.keys(REGLAS_OPCIONALES)) opciones[k] = g(`regla_${k}`) || (g("reglasVariante") && variante.reglas.includes(k));
  // En Ysystem3 «noquear» ya es regla oficial; solo la Edición Revisada necesita el hack.
  if (conjunto.id === "srd" && edicion.id === "y3") opciones.noquear = true;
  const poderesAjuste = g("poderes");
  const poderes = poderesAjuste === "auto" ? variante.poderes : poderesAjuste === "ninguno" ? null : poderesAjuste;
  cache = { claveVariante, variante, conjunto, edicion, opciones, poderes, proezaCritico: g("proezaCritico"), pulp: variante.pulp && conjunto.id === "srd" };
  return cache;
}

export const esSRD = () => contexto().conjunto.id === "srd";

function aplicarTema() {
  document.body.dataset.ysTema = contexto().variante.tema;
}

function alCambiar() {
  invalidarContexto();
  aplicarTema();
  // Los datos derivados (valores fijos, Resistencias, penalizadores) dependen de la ambientación y la edición.
  for (const a of game.actors) a.reset();
  for (const app of foundry.applications.instances.values()) {
    if (app.document?.documentName === "Actor" || app.document?.documentName === "Item") app.render();
    else if (app.constructor?.name === "PanelDirector" || app.constructor?.name === "Creador") app.render();
  }
  ui.actors?.render();
}

/** Registrar en `init`. */
export function registrarAjustes() {
  const mundo = (clave, datos) => game.settings.register(ID, clave, { scope: "world", config: true, onChange: alCambiar, ...datos });

  mundo("variant", {
    name: "Ambientación (variante)", hint: "Cambia la apariencia y, en las variantes de YayoSystem, también las reglas (atributos, habilidades, valores fijos y nombres). Las de Ysystem3 solo activan las reglas opcionales que el libro recomienda para ese género.",
    type: String, default: "base", choices: Object.fromEntries(Object.entries(VARIANTES).map(([k, v]) => [k, v.label]))
  });
  mundo("edicion", {
    name: "Edición de las reglas", hint: "Ysystem3 (SRD 2026) o Edición Revisada (2023). Cambian el daño de las armas largas, los explosivos, la curación, el tope de 5D, el punto de guion y otras cifras. No afecta a IMSERSO ni a Dungeons & Yayos.",
    type: String, default: "y3", choices: { y3: EDICIONES.y3.nombre, er: EDICIONES.er.nombre }
  });
  mundo("reglasVariante", {
    name: "Reglas opcionales de la ambientación", hint: "Activa a la vez las reglas opcionales que recomienda la variante elegida (pánico ampliado en el horror, duelos en capa y espada…).",
    type: Boolean, default: true
  });
  for (const [clave, r] of Object.entries(REGLAS_OPCIONALES)) {
    mundo(`regla_${clave}`, { name: `Regla opcional · ${r.label}`, hint: r.hint, type: Boolean, default: false });
  }
  mundo("poderes", {
    name: "Magia o psiónica", hint: "Habilita la habilidad y los puntos de Poder del capítulo «Magia y poderes». «Según la ambientación» los activa en fantasía, ciencia ficción, ciberpunk y horror lovecraftiano.",
    type: String, default: "auto", choices: { auto: "Según la ambientación", ninguno: "Desactivada", magia: "Magia", psionica: "Psiónica" }
  });
  mundo("proezaCritico", {
    name: "Proeza por crítico", hint: "Cada éxito crítico en una tirada de habilidad entrega 1 proeza (el SRD lo limita a las tiradas que pide el DJ y excluye las repeticiones con proeza). Desactívalo si prefieres darla a mano.",
    type: Boolean, default: true
  });
  game.settings.register(ID, "asistente", { name: "Abrir el asistente al crear un PJ", scope: "client", config: true, type: Boolean, default: true });
  game.settings.register(ID, "bienvenida", { scope: "world", config: false, type: String, default: "" });
  game.settings.register(ID, "dias", { scope: "world", config: false, type: Number, default: 0 });
}

/** Registrar en `ready`: aplica el tema al cuerpo de la página. */
export function iniciarTema() { aplicarTema(); }
