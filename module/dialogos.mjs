/**
 * Diálogos de entrada: una sola función para todos los formularios del sistema.
 * Cada fila declara su campo; el resultado es un objeto {nombre: valor} (números como números,
 * casillas como booleanos). Devuelve null si se cierra sin aceptar.
 */
import { DialogV2 } from "./compat.mjs";
import { ConMemoria } from "./memoria.mjs";

const esc = foundry.utils.escapeHTML;

function fila(f) {
  const id = `ys-${f.nombre}`;
  const ayuda = f.ayuda ? `<small>${esc(f.ayuda)}</small>` : "";
  if (f.tipo === "check") {
    return `<label class="ys-fila ys-fila-check" for="${id}"><input type="checkbox" id="${id}" name="${f.nombre}" ${f.valor ? "checked" : ""} ${f.desactivado ? "disabled" : ""}>
      <span>${esc(f.etiqueta)}${ayuda}</span></label>`;
  }
  let control;
  if (f.tipo === "sel") {
    const op = f.opciones.map(o => `<option value="${esc(o.valor)}" ${String(o.valor) === String(f.valor) ? "selected" : ""}>${esc(o.etiqueta)}</option>`).join("");
    control = `<select id="${id}" name="${f.nombre}">${op}</select>`;
  } else if (f.tipo === "texto") {
    control = `<input type="text" id="${id}" name="${f.nombre}" value="${esc(f.valor ?? "")}">`;
  } else {
    control = `<input type="number" id="${id}" name="${f.nombre}" value="${f.valor ?? 0}" min="${f.min ?? ""}" max="${f.max ?? ""}" step="1" inputmode="numeric">`;
  }
  return `<div class="ys-fila"><label for="${id}"><span>${esc(f.etiqueta)}</span>${ayuda}</label>${control}</div>`;
}

class DialogoYsystem extends ConMemoria(DialogV2) {
  static CAMPOS_MEMORIA = ["left", "top"];
}

/**
 * @param {object} o
 * @param {string} o.titulo
 * @param {string} [o.intro]   Texto HTML sobre el formulario.
 * @param {object[]} o.filas   {nombre, etiqueta, tipo: num|check|sel|texto, valor, min, max, opciones, ayuda, desactivado}
 * @param {string} [o.ok]      Texto del botón.
 */
export async function pedirDatos({ titulo, intro = "", filas, ok = "Aceptar", memoria }) {
  const content = `${intro ? `<div class="ys-intro">${intro}</div>` : ""}<div class="ys-form">${filas.map(fila).join("")}</div>`;
  return DialogoYsystem.input({
    window: { title: titulo, icon: "fa-solid fa-dice-six" },
    classes: ["ysystem3", "ys-dialogo"],
    position: { width: 560 },
    content,
    ok: { label: ok, icon: "fa-solid fa-check" },
    rejectClose: false,
    memoria: memoria ?? `dialogo.${titulo}`
  });
}

/** Confirmación sí/no. */
export function confirmar({ titulo, contenido, si = "Aceptar", no = "Cancelar" }) {
  return DialogV2.confirm({
    window: { title: titulo, icon: "fa-solid fa-circle-question" },
    classes: ["ysystem3", "ys-dialogo"],
    content: `<div class="ys-intro">${contenido}</div>`,
    yes: { label: si, icon: "fa-solid fa-check" },
    no: { label: no },
    rejectClose: false
  });
}
