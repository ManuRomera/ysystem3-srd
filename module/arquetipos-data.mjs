/**
 * Plantillas de personaje (arquetipos) para el SRD de Ysystem3. No son del SRD: son atajos de creación
 * que respetan sus reglas (bonificadores 0/+1/+2/+4/+6 repartidos, 4 habilidades a 3D y 8 a 2D) y
 * un talento del cap. 7. El test `tests/datos.test.mjs` comprueba que todas cuadran con las fórmulas.
 */
import { normalizarHabilidades } from "./config.mjs";
import * as R from "./reglas.mjs";

const habilidades = (d3 = [], d2 = []) => {
  const out = normalizarHabilidades({});
  for (const k of d2) out[k] = { dados: 2 };
  for (const k of d3) out[k] = { dados: 3 };
  return out;
};

const plantilla = ({ attrs, ...resto }) => ({
  genero: "", attrs,
  proezas: R.proezasIniciales(attrs.fue, attrs.int),
  resistenciaFisica: R.resistenciaFisica(attrs.fue),
  saludBase: R.saludBase(attrs.fue),
  ...resto
});

export const ARQUETIPOS = [
  plantilla({
    key: "srd-accion", name: "PJ de acción", perfil: "Acción y supervivencia",
    attrs: { car: 1, des: 4, fue: 6, int: 0, per: 2 },
    d3: ["atletismo", "fuerzaBruta", "lucha", "punteria"],
    d2: ["conducir", "entorno", "intimidacion", "mecanica", "observacion", "rastreo", "sigilo", "supervivencia"],
    talentName: "Duro de pelar", talent: "Puedes gastar una proeza en cualquier momento para tirar por Resistencia Física o Resistencia Mental con 1D adicional. También puedes gastar otra proeza para repetir la tirada.",
    description: "Combate, esfuerzo físico y supervivencia."
  }),
  plantilla({
    key: "srd-investigacion", name: "PJ de investigación", perfil: "Investigación y conocimiento",
    attrs: { car: 1, des: 0, fue: 2, int: 6, per: 4 },
    d3: ["cultura", "informacion", "observacion", "psicologia"],
    d2: ["auxilio", "conversacion", "entorno", "idiomaExtranjero1", "mecanica", "memoria", "rastreo", "simulacion"],
    talentName: "Ojo clínico", talent: "Cuando gastas una proeza para tirar más dados en las habilidades de Información u Observación, obtienes dos dados en lugar de uno.",
    description: "Pesquisas, deducción y escenas de información."
  }),
  plantilla({
    key: "srd-social", name: "PJ social", perfil: "Interacción social",
    attrs: { car: 6, des: 1, fue: 0, int: 4, per: 2 },
    d3: ["conversacion", "intimidacion", "seduccion", "simulacion"],
    d2: ["cultura", "idiomaExtranjero1", "informacion", "memoria", "observacion", "psicologia", "sigilo", "supervivencia"],
    talentName: "Dejadme hacerlo a mí", talent: "Tiendes a tener éxito en lo que realmente importa: cuando gastas una proeza en cualquier tirada de habilidad añades +2 al resultado final.",
    description: "Interacción social, engaño y voluntad."
  }),
  plantilla({
    key: "srd-exploracion", name: "PJ de exploración", perfil: "Exploración y movimiento",
    attrs: { car: 0, des: 6, fue: 2, int: 1, per: 4 },
    d3: ["atletismo", "conducir", "ocultacion", "sigilo"],
    d2: ["auxilio", "entorno", "fuerzaBruta", "lucha", "observacion", "punteria", "rastreo", "supervivencia"],
    talentName: "Capacidad de superación", talent: "Puedes repetir dos tiradas por sesión sin necesidad de gastar proezas.",
    description: "Persecuciones, sigilo y movimiento."
  })
];

export const arquetipoByKey = clave => ARQUETIPOS.find(a => a.key === clave || a.name === clave) ?? null;
export const archetypeSkills = a => habilidades(a.d3, a.d2);

/** Estabilidad = Aplomo + 5 + 1D = CAR + INT + 10 + 1D (cap. 6). */
export function archetypeSystem(a, tiradaSalud = 4, tiradaEstabilidad = 4) {
  const salud = a.saludBase + tiradaSalud;
  const car = Number(a.attrs.car) || 0;
  const int = Number(a.attrs.int) || 0;
  const estabilidad = R.estabilidadBase(R.aplomo(car, int)) + tiradaEstabilidad;
  const umbrales = Object.fromEntries(R.UMBRALES.map(u => [u, false]));
  return {
    "system.datos.arquetipo": a.name,
    "system.datos.talento": `${a.talentName}. ${a.talent}`,
    "system.datos.perfil": a.perfil ?? "",
    "system.atributos": a.attrs,
    "system.habilidades": archetypeSkills(a),
    "system.proezas.valor": a.proezas, "system.proezas.inicial": a.proezas,
    "system.salud.valor": salud, "system.salud.max": salud,
    "system.resistenciaFisica.valor": a.resistenciaFisica, "system.resistenciaFisica.primeraTirada": false, "system.resistenciaFisica.umbrales": umbrales,
    "system.estabilidad.valor": estabilidad, "system.estabilidad.max": estabilidad,
    "system.resistenciaMental.valor": R.resistenciaMental(car), "system.resistenciaMental.primeraTirada": false, "system.resistenciaMental.umbrales": { ...umbrales },
    "system.recuerdo.usado": false, "system.recuerdo.usos": 0, "system.defectos.leveUsado": false
  };
}

export const archetypeTalentItem = a => ({
  name: a.talentName, type: "talento", img: "systems/ysystem3-srd/assets/iconos/talento.svg",
  system: { descripcion: a.talent, usos: { valor: 0, max: 0 }, equipado: false, automatismo: "" }
});

export const archetypeItem = a => ({
  name: a.name, type: "arquetipo", img: "systems/ysystem3-srd/assets/iconos/arquetipo.svg",
  system: {
    arquetipoKey: a.key, genero: a.genero, perfil: a.perfil, atributos: a.attrs, habilidades: archetypeSkills(a),
    habilidades3d: a.d3, habilidades2d: a.d2, proezas: a.proezas, saludBase: a.saludBase, resistenciaFisica: a.resistenciaFisica,
    resistenciaMental: R.resistenciaMental(a.attrs.car), talentoNombre: a.talentName, talento: a.talent, descripcion: a.description
  }
});

export const ARQUETIPO_ITEMS = ARQUETIPOS.map(archetypeItem);
