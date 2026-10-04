/**
 * Talentos con efecto mecánico (SRD cap. 7). Tabla por nombre: el actor reúne los efectos de los talentos
 * que tiene (objetos de tipo talento, o el nombre escrito en el campo «Talento») y las tiradas los consultan.
 * Los que son puramente narrativos no aparecen: al usarlos solo se gasta el uso y se avisa en el chat.
 *
 * Efectos reconocidos (todos opcionales):
 *  critUnSeis        habilidades en las que un solo 6 es crítico ("todas" o lista)
 *  dadoFijo          { habilidades, resistencias } dado extra permanente
 *  dadoSiempre       dado extra permanente en la lista de habilidades y resistencias
 *  dadoOpcional      { etiqueta, usos? } casilla en el diálogo de tirada que suma 1D
 *  proezaDoble       habilidades en las que la proeza da 2D en lugar de 1D
 *  proezaMas2        gastar una proeza en una tirada suma +2 al resultado
 *  proezaRecupera    si el dado de la proeza saca un 6, se recupera la proeza
 *  critProezas       proezas que da un crítico (2 en lugar de 1)
 *  combinadas        { porColaborador, maximo }
 *  ayudaDoble        ayudar cede 2D en lugar de 1D
 *  atributoDoble     { atributo, habilidades } el bonificador cuenta doble
 *  repeticionGratis  { habilidades?, usos? } repetir dados sin gastar proeza
 *  apuntar           { mas3?: true, mult?: 3 }
 *  explotaCon        los dados de proeza de daño explotan con este valor o más
 *  danoExtraDado     tipos de ataque que hacen 1D extra de daño
 *  primerTurnoDano   1D extra de daño en el primer turno del combate si se actúa antes
 *  danoFuego         daño base de las armas de fuego (sustituye)
 *  ignoraPenalizador gastar una proeza anula el penalizador de Salud en un combate
 *  resistenciaProeza gastar una proeza da 1D a Resistencia física o mental
 *  panico            { sinMayor: true }
 *  recuerdoUsos      veces que se puede usar el Recuerdo cuando…
 *  recuerdoRepite    un Recuerdo con éxito se conserva
 *  iniciativa2D      tirar 2D de iniciativa y quedarse con el mejor
 *  auxilioCura       { normal, critico, pifia } curación con Auxilio
 */
import { claveAutomatismo } from "./reglas.mjs";

const TODAS = "todas";

export const EFECTOS = {
  "seguro-de-si-mismo": { critProezas: 2 },
  "al-saber-le-llaman-suerte": { proezaRecupera: true },
  "dejadme-hacerlo-a-mi": { proezaMas2: true },
  "capacidad-de-superacion": { repeticionGratis: { usos: 2 } },
  "duro-de-pelar": { resistenciaProeza: true },
  "ojo-clinico": { proezaDoble: ["informacion", "observacion"] },
  "espiritu-felino": { critUnSeis: ["atletismo"] },
  "memoria-prodigiosa": { critUnSeis: ["memoria"] },
  "nadie-se-lo-esperaria-de-ti": { critUnSeis: TODAS },
  "nadie-se-lo-espera-de-ti": { critUnSeis: TODAS },
  "no-se-me-escapa-una": { critUnSeis: ["observacion", "oido"] },
  "adicto-al-gimnasio": { dadoFijo: { habilidades: ["fuerzaBruta"], resistencias: ["fisica"] } },
  "sangre-fria": { dadoFijo: { resistencias: ["mental"] } },
  "el-encuadre-perfecto": { proezaDoble: ["observacion"] },
  "actor-de-metodo": { proezaDoble: ["simulacion"] },
  "nacido-en-la-malla": { proezaDoble: ["informacion"] },
  "buen-companero": { combinadas: { porColaborador: 4, maximo: 12 } },
  "siempre-dispuesto-a-echar-una-mano": { ayudaDoble: true },
  "guapo-como-el-demonio": { atributoDoble: { atributo: "car", habilidades: ["conversacion", "seduccion"] } },
  "manitas": { repeticionGratis: { habilidades: ["mecanica"] } },
  "solo-tengo-que-conectar-este-cable-con-este-otro-y-entonces": { repeticionGratis: { habilidades: ["mecanica", "informacion"], porTirada: true } },
  "actuacion-estelar": { repeticionGratis: { habilidades: ["simulacion"], usos: 1 } },
  "soy-invisible": { repeticionGratis: { habilidades: ["ocultacion"], porTirada: true } },
  "charlatan-pragmatico": { repeticionGratis: { habilidades: ["conversacion", "seduccion", "simulacion"], soloFallo: true } },
  "competitivo": { dadoOpcional: { etiqueta: "Competitivo: en competencia expresa (+1D)" } },
  "sutil-como-una-rata-y-valiente-como-una-gallina": { dadoOpcional: { etiqueta: "Sutil como una rata: para salvar tu pellejo (+1D)" } },
  "concentracion": { dadoOpcional: { etiqueta: "Concentración: tras reflexionar (+1D)", usos: 2 } },
  "amigo-de-las-sombras": { dadoOpcional: { etiqueta: "Amigo de las sombras: en la oscuridad (+1D)" } },
  "puntería-mortifera": { apuntar: { mas3: true } },
  "punteria-mortifera": { apuntar: { mas3: true } },
  "donde-pone-el-ojo-cava-la-tumba": { apuntar: { mult: 3 } },
  "fuerza-ciclopea-golpe-mortal": { explotaCon: 4 },
  "la-dialectica-de-los-punos-y-las-pistolas": { danoExtraDado: ["desarmado", "desarmadoEspecial", "fuegoCorto", "fuegoLargo", "fuegoLetal", "sinArmas"] },
  "dispara-primero-pregunta-despues": { primerTurnoDano: true },
  "afinidad-con-las-armas": { danoFuego: { fuegoCorto: 10, fuegoLargo: 15, fuegoLetal: 20 } },
  "retroceder-nunca-rendirse-jamas": { ignoraPenalizador: true },
  "curado-de-espanto": { panico: { sinMayor: true } },
  "vidas-pasadas": { recuerdoUsos: 3 },
  "la-experiencia-es-un-grado": { recuerdoRepite: true },
  "rapido-y-mortal": { iniciativa2D: true },
  "sexto-sentido": { iniciativa2D: true },
  "mano-de-santo": { auxilioCura: { normal: 3, critico: 5, pifia: 1 } }
};

/** Talentos que se activan con un botón (gastan un uso y avisan en el chat). */
export const ACTIVOS = new Set([
  "afortunado", "camaleon-social", "sonrisa-cautivadora", "eso-sale-en-mi-libro", "discurso-memorable", "amigos-en-las-altas-esferas",
  "bajos-fondos", "meditacion", "adaptabilidad", "cinturon-de-herramientas", "damisela-en-apuros", "escudo-humano", "protector",
  "un-poco-de-todo", "tiene-que-tener-una-explicacion-racional", "es-mi-familia", "hermano-mayor", "huida-eficaz", "contencion", "nada-que-perder"
]);

export const clave = nombre => claveAutomatismo(nombre).replace(/^-+/, "");

/** Efectos acumulados de los talentos de un actor. */
export function efectosDe(actor) {
  const nombres = new Set();
  for (const i of actor.items ?? []) if (i.type === "talento") nombres.add(clave(i.name));
  const escrito = actor.system?.datos?.talento;
  if (escrito) {
    const c = clave(escrito);
    for (const k of Object.keys(EFECTOS)) if (c.includes(k)) nombres.add(k);
  }
  const fx = { nombres: [...nombres] };
  for (const nombre of nombres) {
    const e = EFECTOS[nombre];
    if (!e) continue;
    for (const [k, v] of Object.entries(e)) {
      if (Array.isArray(v)) fx[k] = [...new Set([...(fx[k] ?? []), ...v])];
      else if (v && typeof v === "object") fx[k] = { ...(fx[k] ?? {}), ...v };
      else fx[k] = v === true ? true : Math.max(fx[k] ?? 0, v);
    }
  }
  return fx;
}

/** ¿Vale la lista de habilidades (o "todas") para esta habilidad? */
export const aplica = (lista, habilidad) => lista === TODAS || (Array.isArray(lista) && lista.includes(habilidad));
