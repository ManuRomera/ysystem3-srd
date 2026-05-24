import { IMSERSO } from "./config.mjs";

const DEFECTOS = [
  "Codicioso", "Inseguro", "Dolor cronico", "Duro de oido", "Mentiroso compulsivo",
  "Irascible", "Torpe", "Obsesivo", "Temerario", "Desconfiado"
];

const RULE_PAGES = [
  {
    name: "Tiradas y dificultades (Ysystem3 SRD)",
    body: [
      "Solo se usan D6. Tirada de habilidad = suma de dados de habilidad (1 a 3D) + bonus de atributo (0, +1, +2, +4 o +6) + modificadores.",
      "Dificultades habituales: muy facil 5-6, facil 7-8, media 9-10, desafiante 11-13, dificil 14-17, muy dificil 18-21, extrema 22-25.",
      "Profesion o perfil sociolaboral: +3 si la accion encaja.",
      "Tope de dados en una tirada: nunca mas de 5D en total.",
      "Critico (solo habilidad): dos o mas seises en los dados de habilidad, aunque no alcance la dificultad.",
      "Pifia (solo habilidad): todos los dados de habilidad muestran 1, aunque alcance la dificultad.",
      "Sin critico ni pifia en Iniciativa, Resistencia fisica/mental ni tiradas de miedo."
    ]
  },
  {
    name: "Proezas, defectos y recuerdo",
    body: [
      "Proezas iniciales por sesion: redondear hacia abajo (bonus FUE + bonus INT) / 2 + 3.",
      "1 proeza: repetir dados de una tirada fallada (sin critico en la repeticion).",
      "1 proeza (antes): +1D en tirada de habilidad (no en Resistencia).",
      "N proezas: +3 a Agilidad, Aplomo o Perspicacia durante 1 turno cada una.",
      "En combate: 1-2 proezas (+1D dano c/u melee/no fuego), 1-3 con armas de fuego; los 6 en dano explotan.",
      "Defecto grave: repetir con -1D (mantiene atributo); el PJ gana 1 proeza. Defecto leve: repetir 1 vez por sesion.",
      "Recuerdo cuando...: +2D una vez por sesion o aventura (no combinable con +1D de proeza en la misma tirada)."
    ]
  },
  {
    name: "Valores fijos",
    body: [
      "Agilidad = 3 x dados de Atletismo + bonus DES.",
      "Aplomo = bonus CAR + bonus INT + 5.",
      "Perspicacia = bonus INT + bonus PER + 5.",
      "Oposicion: una tirada del PJ contra Agilidad, Aplomo o Perspicacia del objetivo (el DJ no tira salvo combate)."
    ]
  },
  {
    name: "Combate (Ysystem3 SRD)",
    body: [
      "Iniciativa: 1D6 + DES + INT (una vez por combate). Un 6 en el dado da accion extra el primer turno.",
      "Atacar: Lucha o Punteria contra Agilidad del objetivo. Desenfundar o cambiar de arma: -1D a Punteria.",
      "Dano base: desarmado 1 + FUE/2; desarmado especial 2 + FUE/2; melee 1 mano 3 + FUE; melee 2 manos 3 + FUEx1,5; distancia 3 + PER; fuego corta 7 + PER; fuego larga 11 + PER; letal 15 + PER.",
      "Critico en ataque: dobla dano base e ignora armadura. Pifia: caida, arma caida o encasquillamiento.",
      "Apuntar: sacrifica dados de habilidad (+1D dano por dado melee, +2D por dado a distancia).",
      "Defensa completa: +1D Agilidad este turno y +1 puesto de iniciativa desde el siguiente.",
      "Inmovilizar: Lucha vs Agilidad + 3. Zafarse: Fuerza bruta vs Agilidad + 3 del agarrador."
    ]
  },
  {
    name: "Salud y estabilidad",
    body: [
      "Salud max = bonus FUE x 2 + 10 + 1D6. A 0 Salud el personaje muere.",
      "Penalizadores: -1D por debajo de 11 Salud, -2D por debajo de 7, -3D por debajo de 4.",
      "Resistencia fisica = 12 - bonus FUE. Tirada 3D al cruzar por primera vez 16, 11, 7, 4 o 2 Salud.",
      "Estabilidad max = Aplomo + 5 + 1D6. A 0 Estabilidad: locura permanente.",
      "Resistencia mental = 12 - bonus CAR. Tirada 3D en umbrales 16, 11, 7, 4, 2 de Estabilidad.",
      "Miedo (DJ, 1-7D): si la suma iguala o supera el Aplomo del PJ, pierde tanta Estabilidad como dados lanzados."
    ]
  },
  {
    name: "Otras reglas y creacion",
    body: [
      "Armadura: resta su nivel al dano; penaliza habilidades floor(nivel/2). Escudo: suma nivel a Agilidad; penaliza nivel completo.",
      "Creacion: atributos 0/+1/+2/+4/+6; 4 habilidades a 3D, 8 a 2D, 12 a 1D; defecto grave y leve.",
      "Anexo Pulp (variante): ignora umbral 16 en Salud/Estabilidad; salvacion in extremis; proeza por cita; +1D en Resistencia con proeza previa.",
      "Referencia completa: https://walhallaediciones.gitlab.io/ysystem/srd/"
    ]
  }
];

export function getAchaque(index) {
  return DEFECTOS[(Number(index) - 1) % DEFECTOS.length] ?? "";
}

export function getDefecto(index) {
  return getAchaque(index);
}

export function rollAchaqueIndexes() {
  return {
    menor: Math.floor(Math.random() * DEFECTOS.length) + 1,
    mayor: Math.floor(Math.random() * DEFECTOS.length) + 1
  };
}

export function rollDefectoIndexes() {
  return rollAchaqueIndexes();
}

export function buildAchaquesTables() {
  return [{
    name: "Defectos de ejemplo",
    img: "icons/svg/d20-grey.svg",
    formula: `1d${DEFECTOS.length}`,
    replacement: true,
    displayRoll: true,
    results: DEFECTOS.map((text, index) => ({
      type: 0,
      text,
      img: "icons/svg/d20-grey.svg",
      weight: 1,
      range: [index + 1, index + 1],
      drawn: false
    }))
  }];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pageHtml(page) {
  return `<article class="ims-journal-adventure ims-rules-journal"><h1>${escapeHtml(page.name)}</h1><ul>${page.body.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul></article>`;
}

export function buildReglasJournals() {
  return RULE_PAGES.map((page) => ({
    name: page.name,
    flags: { [IMSERSO.ID]: { seeded: true } },
    pages: [{
      name: page.name,
      type: "text",
      text: { content: pageHtml(page) }
    }]
  }));
}
