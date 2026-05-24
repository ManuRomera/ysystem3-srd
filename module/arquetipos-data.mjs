import { defaultSkills } from "./config.mjs";

function skills(d3 = [], d2 = []) {
  const out = defaultSkills(1);
  for (const key of d2) out[key] = { dados: 2 };
  for (const key of d3) out[key] = { dados: 3 };
  return out;
}

export const ARQUETIPOS = [
  {
    key: "srd-accion",
    name: "PJ de accion",
    genero: "",
    perfil: "Accion y supervivencia",
    attrs: { car: 1, des: 4, fue: 6, int: 0, per: 2 },
    proezas: 6,
    resistenciaFisica: 6,
    saludBase: 22,
    d3: ["atletismo", "fuerzaBruta", "lucha", "punteria"],
    d2: ["conducir", "entorno", "intimidacion", "mecanica", "observacion", "rastreo", "sigilo", "supervivencia"],
    talentName: "Duro de pelar",
    talent: "Puedes gastar una proeza para tirar por Resistencia fisica o mental con 1D adicional.",
    description: "Plantilla SRD orientada a combate, esfuerzo fisico y supervivencia."
  },
  {
    key: "srd-investigacion",
    name: "PJ de investigacion",
    genero: "",
    perfil: "Investigacion y conocimiento",
    attrs: { car: 1, des: 0, fue: 2, int: 6, per: 4 },
    proezas: 7,
    resistenciaFisica: 10,
    saludBase: 14,
    d3: ["cultura", "informacion", "observacion", "psicologia"],
    d2: ["auxilio", "conversacion", "entorno", "idiomaExtranjero1", "mecanica", "memoria", "rastreo", "simulacion"],
    talentName: "Ojo clinico",
    talent: "Cuando gastas una proeza para tirar mas dados en Informacion u Observacion, obtienes dos dados en lugar de uno.",
    description: "Plantilla SRD para pesquisas, deduccion y escenas de informacion."
  },
  {
    key: "srd-social",
    name: "PJ social",
    genero: "",
    perfil: "Interaccion social",
    attrs: { car: 6, des: 1, fue: 0, int: 4, per: 2 },
    proezas: 5,
    resistenciaFisica: 12,
    saludBase: 10,
    d3: ["conversacion", "intimidacion", "seduccion", "simulacion"],
    d2: ["cultura", "idiomaExtranjero1", "informacion", "memoria", "observacion", "psicologia", "sigilo", "supervivencia"],
    talentName: "Dejadme hacerlo a mi",
    talent: "Cuando gastas una proeza en cualquier tirada de habilidad, anades +2 al resultado final.",
    description: "Plantilla SRD centrada en interaccion social, engano y voluntad."
  },
  {
    key: "srd-exploracion",
    name: "PJ de exploracion",
    genero: "",
    perfil: "Exploracion y movimiento",
    attrs: { car: 0, des: 6, fue: 2, int: 1, per: 4 },
    proezas: 4,
    resistenciaFisica: 10,
    saludBase: 14,
    d3: ["atletismo", "conducir", "ocultacion", "sigilo"],
    d2: ["auxilio", "entorno", "fuerzaBruta", "lucha", "observacion", "punteria", "rastreo", "supervivencia"],
    talentName: "Capacidad de superacion",
    talent: "Puedes repetir dos tiradas por sesion sin necesidad de gastar proezas.",
    description: "Plantilla SRD para persecuciones, sigilo y movimiento."
  }
];

export function arquetipoByKey(key) {
  return ARQUETIPOS.find((arquetipo) => arquetipo.key === key || arquetipo.name === key) ?? null;
}

export function archetypeSkills(arquetipo) {
  return skills(arquetipo.d3, arquetipo.d2);
}

export function archetypeSystem(arquetipo, healthRoll = 4) {
  const salud = arquetipo.saludBase + healthRoll;
  const car = Number(arquetipo.attrs.car) || 0;
  const int = Number(arquetipo.attrs.int) || 0;
  const estabilidad = car + int + 16;
  return {
    "system.datos.arquetipo": arquetipo.name,
    "system.datos.talento": `${arquetipo.talentName}. ${arquetipo.talent}`,
    "system.datos.perfil": arquetipo.perfil ?? "",
    "system.atributos": arquetipo.attrs,
    "system.habilidades": archetypeSkills(arquetipo),
    "system.proezas.valor": arquetipo.proezas,
    "system.proezas.inicial": arquetipo.proezas,
    "system.salud.valor": salud,
    "system.salud.max": salud,
    "system.resistenciaFisica.valor": arquetipo.resistenciaFisica,
    "system.resistenciaFisica.primeraTirada": false,
    "system.resistenciaFisica.umbrales": { 16: false, 11: false, 7: false, 4: false, 2: false },
    "system.estabilidad.valor": estabilidad,
    "system.estabilidad.max": estabilidad,
    "system.resistenciaMental.valor": 12 - car,
    "system.resistenciaMental.primeraTirada": false,
    "system.resistenciaMental.umbrales": { 16: false, 11: false, 7: false, 4: false, 2: false }
  };
}

export function archetypeTalentItem(arquetipo) {
  return {
    name: arquetipo.talentName,
    type: "talento",
    img: "icons/svg/d20-grey.svg",
    system: {
      descripcion: arquetipo.talent,
      usos: { valor: 1, max: 1 },
      equipado: false,
      automatismo: ""
    }
  };
}

export function archetypeItem(arquetipo) {
  return {
    name: arquetipo.name,
    type: "arquetipo",
    img: "icons/svg/aura.svg",
    system: {
      arquetipoKey: arquetipo.key,
      genero: arquetipo.genero,
      perfil: arquetipo.perfil,
      atributos: arquetipo.attrs,
      habilidades: archetypeSkills(arquetipo),
      habilidades3d: arquetipo.d3,
      habilidades2d: arquetipo.d2,
      proezas: arquetipo.proezas,
      saludBase: arquetipo.saludBase,
      resistenciaFisica: arquetipo.resistenciaFisica,
      resistenciaMental: 12 - (Number(arquetipo.attrs.car) || 0),
      talentoNombre: arquetipo.talentName,
      talento: arquetipo.talent,
      descripcion: arquetipo.description
    }
  };
}

export const ARQUETIPO_ITEMS = ARQUETIPOS.map((arquetipo) => archetypeItem(arquetipo));
