/**
 * Configuración estática del sistema: claves de atributos y habilidades, tipos de ataque,
 * conjuntos de reglas (SRD, IMSERSO, Dungeons & Yayos) y variantes de ambientación.
 * Sin dependencias de Foundry: se importa también desde los tests y desde scripts/.
 *
 * Las claves internas (car, des, fue, int, per; atletismo, fuerzaBruta…) son las de las versiones
 * 0.x a propósito: los mundos existentes y los módulos satélite escriben en esas rutas.
 */
export const ID = "ysystem3-srd";
export const RUTA = `systems/${ID}`;

/** Los tres valores fijos y pasivos del reglamento. */
export const FIJOS = ["agilidad", "aplomo", "perspicacia"];

/* ------------------------------------------------------------------ */
/* Conjunto SRD (Ysystem3 y Edición Revisada)                         */
/* ------------------------------------------------------------------ */

const ATRIBUTOS_SRD = {
  car: { label: "Carisma", short: "CAR" },
  des: { label: "Destreza", short: "DES" },
  fue: { label: "Fuerza", short: "FUE" },
  int: { label: "Inteligencia", short: "INT" },
  per: { label: "Percepción", short: "PER" }
};

/**
 * `oposicion`: valor fijo del objetivo que sirve de dificultad (SRD cap. 4).
 * La lista de habilidades afectadas por la oscuridad depende de la edición (ver reglas.mjs).
 */
const HABILIDADES_SRD = {
  atletismo: { label: "Atletismo", atributo: "des", oposicion: "agilidad" },
  auxilio: { label: "Auxilio", atributo: "int", oposicion: "" },
  conducir: { label: "Conducir", atributo: "des", oposicion: "agilidad" },
  conversacion: { label: "Conversación", atributo: "car", oposicion: "aplomo" },
  cultura: { label: "Cultura", atributo: "int", oposicion: "" },
  entorno: { label: "Entorno", atributo: "per", oposicion: "" },
  fuerzaBruta: { label: "Fuerza bruta", atributo: "fue", oposicion: "agilidad" },
  idiomaExtranjero1: { label: "Idioma extranjero I", atributo: "int", oposicion: "" },
  idiomaExtranjero2: { label: "Idioma extranjero II", atributo: "int", oposicion: "" },
  informacion: { label: "Información", atributo: "int", oposicion: "" },
  intimidacion: { label: "Intimidación", atributo: "car", oposicion: "aplomo" },
  lucha: { label: "Lucha", atributo: "des", oposicion: "agilidad" },
  mecanica: { label: "Mecánica", atributo: "int", oposicion: "" },
  memoria: { label: "Memoria", atributo: "int", oposicion: "" },
  observacion: { label: "Observación", atributo: "per", oposicion: "agilidad" },
  ocultacion: { label: "Ocultación", atributo: "des", oposicion: "perspicacia" },
  oido: { label: "Oído", atributo: "per", oposicion: "agilidad" },
  psicologia: { label: "Psicología", atributo: "per", oposicion: "aplomo" },
  punteria: { label: "Puntería", atributo: "per", oposicion: "agilidad" },
  rastreo: { label: "Rastreo", atributo: "per", oposicion: "" },
  seduccion: { label: "Seducción", atributo: "car", oposicion: "aplomo" },
  sigilo: { label: "Sigilo", atributo: "des", oposicion: "perspicacia" },
  simulacion: { label: "Simulación", atributo: "car", oposicion: "perspicacia" },
  supervivencia: { label: "Supervivencia", atributo: "per", oposicion: "" }
};

/** Habilidad opcional de magia o psiónica (SRD, «Magia y poderes»): no depende de ningún atributo. */
export const HABILIDAD_PODER = { label: "Magia", atributo: "", oposicion: "" };

/** Las cuatro habilidades que tienen los PNJ (SRD cap. 3, nota). */
export const HABILIDADES_PNJ = ["atletismo", "fuerzaBruta", "lucha", "punteria"];

/** Tipos de ataque del SRD. `mitad`: suma FUE/2; `mult`: multiplica el atributo; `auto`: admite ráfagas. */
const ATAQUES_SRD = {
  desarmado: { label: "Desarmado normal", habilidad: "lucha", atributo: "fue", mitad: true, apuntar: 1, maxProezas: 2 },
  desarmadoEspecial: { label: "Desarmado especial (artes marciales, puño americano)", habilidad: "lucha", atributo: "fue", mitad: true, apuntar: 1, maxProezas: 2 },
  cuerpoUnaMano: { label: "Cuerpo a cuerpo, arma a una mano", habilidad: "lucha", atributo: "fue", apuntar: 1, maxProezas: 2 },
  cuerpoDosManos: { label: "Cuerpo a cuerpo, arma a dos manos", habilidad: "lucha", atributo: "fue", mult: 1.5, apuntar: 1, maxProezas: 2 },
  distancia: { label: "A distancia, arma no de fuego", habilidad: "punteria", atributo: "per", apuntar: 2, maxProezas: 2, distancia: true },
  fuegoCorto: { label: "Arma de fuego corta (pistola, bláster pequeño)", habilidad: "punteria", atributo: "per", apuntar: 2, maxProezas: 3, distancia: true, fuego: true },
  fuegoLargo: { label: "Arma de fuego larga (escopeta, rifle, bláster)", habilidad: "punteria", atributo: "per", apuntar: 2, maxProezas: 3, distancia: true, fuego: true },
  fuegoLetal: { label: "Arma de fuego mortífera (fusil de asalto, ametralladora)", habilidad: "punteria", atributo: "per", apuntar: 2, maxProezas: 3, distancia: true, fuego: true, auto: true },
  extramortifero: { label: "Extramortífera (asedio, láser pesado, misil)", habilidad: "punteria", atributo: "per", apuntar: 2, maxProezas: 3, distancia: true, fuego: true, libre: true }
};

/** Nombres que usaron las versiones anteriores del sistema. */
export const ALIAS_ATAQUE = { cuerpoLigera: "cuerpoUnaMano", cuerpoPesada: "cuerpoDosManos", fuegoLaser: "fuegoLetal" };

/* ------------------------------------------------------------------ */
/* Conjunto IMSERSO to the limit (YayoSystem)                         */
/* ------------------------------------------------------------------ */

/** Internamente int/car/des/fue: así los mundos antiguos conservan sus datos. */
const ATRIBUTOS_YAYO = {
  int: { label: "Cacumen", short: "CAC" },
  car: { label: "Gracejo", short: "GRA" },
  des: { label: "Presteza", short: "PRE" },
  fue: { label: "Robustez", short: "ROB" }
};

const HABILIDADES_IMSERSO = {
  auxilio: { label: "Ambulatorio", atributo: "int", oposicion: "" },
  mecanica: { label: "Archiperres", atributo: "des", oposicion: "" },
  conversacion: { label: "Batallitas", atributo: "car", oposicion: "aplomo" },
  supervivencia: { label: "Cosas del campo", atributo: "des", oposicion: "" },
  simulacion: { label: "Cotilleo", atributo: "car", oposicion: "aplomo" },
  intimidacion: { label: "Discusión", atributo: "car", oposicion: "aplomo" },
  atletismo: { label: "Gimnasia", atributo: "des", oposicion: "agilidad" },
  conducir: { label: "Ingesta", atributo: "fue", oposicion: "" },
  informacion: { label: "Internés", atributo: "int", oposicion: "" },
  observacion: { label: "Lentes progresivas", atributo: "int", oposicion: "agilidad" },
  memoria: { label: "Memoria", atributo: "int", oposicion: "" },
  fuerzaBruta: { label: "Mula parda", atributo: "fue", oposicion: "" },
  entorno: { label: "Nietos", atributo: "des", oposicion: "agilidad" },
  punteria: { label: "Petanca", atributo: "des", oposicion: "agilidad" },
  seduccion: { label: "Salero", atributo: "car", oposicion: "aplomo" },
  idiomaExtranjero1: { label: "Silbido", atributo: "car", oposicion: "aplomo" },
  oido: { label: "Sonotone", atributo: "int", oposicion: "agilidad" },
  ocultacion: { label: "Sus labores", atributo: "des", oposicion: "aplomo" },
  cultura: { label: "Telediarios", atributo: "int", oposicion: "" },
  lucha: { label: "Tollinas", atributo: "fue", oposicion: "agilidad" }
};

const ATAQUES_IMSERSO = {
  sinArmas: { label: "Sin armas", habilidad: "lucha", atributo: "fue", apuntar: 1, maxProezas: 3, dano: 2, iniciativa: 0 },
  cuerpo: { label: "Arma cuerpo a cuerpo", habilidad: "lucha", atributo: "fue", apuntar: 1, maxProezas: 3, dano: 4, iniciativa: 2 },
  fuegoPequena: { label: "Arma de fuego pequeña", habilidad: "punteria", atributo: "des", apuntar: 2, maxProezas: 3, dano: 7, iniciativa: 5, distancia: true, fuego: true },
  fuegoGrande: { label: "Arma de fuego grande", habilidad: "punteria", atributo: "des", apuntar: 2, maxProezas: 3, dano: 10, iniciativa: 5, distancia: true, fuego: true }
};

/* ------------------------------------------------------------------ */
/* Conjunto Dungeons & Yayos                                          */
/* ------------------------------------------------------------------ */

const HABILIDADES_DY = {
  atletismo: { label: "Atletismo", atributo: "des", oposicion: "agilidad" },
  lanzamiento: { label: "Lanzamiento", atributo: "des", oposicion: "agilidad" },
  robar: { label: "Robar", atributo: "des", oposicion: "agilidad" },
  batallitas: { label: "Batallitas", atributo: "car", oposicion: "aplomo" },
  magiaPotagia: { label: "Magia Potagia", atributo: "int", oposicion: "" },
  salero: { label: "Salero", atributo: "car", oposicion: "aplomo" },
  cerrojosTrampas: { label: "Cerrojos y Trampas", atributo: "des", oposicion: "" },
  medicina: { label: "Medicina", atributo: "int", oposicion: "" },
  sapiencia: { label: "Sapiencia", atributo: "int", oposicion: "" },
  cosasCampo: { label: "Cosas del Campo", atributo: "des", oposicion: "" },
  memoria: { label: "Memoria", atributo: "int", oposicion: "" },
  silbido: { label: "Silbido", atributo: "car", oposicion: "aplomo" },
  cotilleo: { label: "Cotilleo", atributo: "car", oposicion: "aplomo" },
  mulaParda: { label: "Mula Parda", atributo: "fue", oposicion: "" },
  tollinas: { label: "Tollinas", atributo: "fue", oposicion: "agilidad" },
  discusion: { label: "Discusión", atributo: "car", oposicion: "aplomo" },
  nietos: { label: "Nietos", atributo: "des", oposicion: "agilidad" },
  vista: { label: "Vista", atributo: "int", oposicion: "agilidad" },
  ingesta: { label: "Ingesta", atributo: "fue", oposicion: "" },
  oido: { label: "Oído", atributo: "int", oposicion: "agilidad" }
};

const ATAQUES_DY = {
  desarmado: { label: "Tollina desarmada", habilidad: "tollinas", atributo: "fue", apuntar: 1, maxProezas: 2, dano: 1 },
  cuerpoUnaMano: { label: "Arma cuerpo a cuerpo", habilidad: "tollinas", atributo: "fue", apuntar: 1, maxProezas: 2, dano: 3 },
  cuerpoDosManos: { label: "Arma cuerpo a cuerpo a dos manos", habilidad: "tollinas", atributo: "fue", apuntar: 1, maxProezas: 2, dano: 5 },
  distancia: { label: "Arma de proyectiles", habilidad: "lanzamiento", atributo: "fue", apuntar: 2, maxProezas: 2, dano: 3, distancia: true },
  hechizoOfensivo: { label: "Hechizo ofensivo", habilidad: "magiaPotagia", atributo: "fue", apuntar: 0, maxProezas: 2, dano: 3, distancia: true }
};

/**
 * Cada conjunto reúne todo lo que cambia entre el SRD y los juegos hermanos de YayoSystem.
 * `fijos`: qué valores fijos existen y cómo se llaman; `recurso`: nombre de las proezas;
 * `tienePanico`: ¿hay Estabilidad y Resistencia Mental?
 */
export const CONJUNTOS = {
  srd: {
    id: "srd", titulo: "Ysystem3 SRD",
    atributos: ATRIBUTOS_SRD, habilidades: HABILIDADES_SRD, ataques: ATAQUES_SRD, bonificadores: [0, 1, 2, 4, 6],
    fijos: { agilidad: "Agilidad", aplomo: "Aplomo", perspicacia: "Perspicacia" },
    recurso: "Proezas", recursoUno: "proeza", rf: "Resistencia física", rm: "Resistencia mental", tienePanico: true,
    profesion: "Profesión o perfil", defectoGrave: "Defecto grave", defectoLeve: "Defecto leve", recuerdo: "Recuerdo cuando…",
    dificultades: [
      { value: 5, label: "5-6 · Muy fácil" }, { value: 7, label: "7-8 · Fácil" }, { value: 9, label: "9-10 · Media" },
      { value: 11, label: "11-13 · Desafiante" }, { value: 14, label: "14-17 · Difícil" }, { value: 18, label: "18-21 · Muy difícil" },
      { value: 22, label: "22-25 · Extrema" }
    ],
    dificultadBase: 9, umbralesSalud: [16, 11, 7, 4, 2], umbralesEstabilidad: [16, 11, 7, 4, 2]
  },
  imserso: {
    id: "imserso", titulo: "IMSERSO to the limit",
    atributos: ATRIBUTOS_YAYO, habilidades: HABILIDADES_IMSERSO, ataques: ATAQUES_IMSERSO, bonificadores: [0, 2, 4, 6],
    fijos: { agilidad: "Nervio", aplomo: "Bemoles", perspicacia: "" },
    recurso: "Yayopoints", recursoUno: "yayopoint", rf: "Jamacuco", rm: "", tienePanico: false,
    profesion: "Antiguo oficio", defectoGrave: "Achaque mayor", defectoLeve: "Achaque menor", recuerdo: "«Es que yo a tus años…»",
    dificultades: [
      { value: 4, label: "4 · Sencilla" }, { value: 8, label: "8 · Media" }, { value: 10, label: "10 · Complicada" },
      { value: 12, label: "12 · Difícil" }, { value: 15, label: "15 · Muy difícil" }, { value: 18, label: "18 · Tremenda" },
      { value: 24, label: "24 · Imposible de narices" }
    ],
    dificultadBase: 8, umbralesSalud: [16, 11, 7, 4, 2], umbralesEstabilidad: [],
    defensaActiva: true, iniciativaArma: true, miedo: { max: 5, contra: "aplomo", pierde: "salud" }
  },
  dungeonsYayos: {
    id: "dungeonsYayos", titulo: "Dungeons & Yayos",
    atributos: ATRIBUTOS_YAYO, habilidades: HABILIDADES_DY, ataques: ATAQUES_DY, bonificadores: [0, 2, 4, 6],
    fijos: { agilidad: "Nervio", aplomo: "Bemoles", perspicacia: "" },
    recurso: "Yayopoints", recursoUno: "yayopoint", rf: "Jamacuco", rm: "", tienePanico: false,
    profesion: "Antigua profesión", defectoGrave: "Achaque mayor", defectoLeve: "Achaque menor", recuerdo: "«Es que yo a tus años…»",
    dificultades: [
      { value: 4, label: "4 · Sencilla" }, { value: 8, label: "8 · Media" }, { value: 10, label: "10 · Complicada" },
      { value: 12, label: "12 · Difícil" }, { value: 15, label: "15 · Muy difícil" }, { value: 18, label: "18 · Tremenda" },
      { value: 24, label: "24 · Imposible de narices" }
    ],
    dificultadBase: 8, umbralesSalud: [16, 11, 7, 4, 2], umbralesEstabilidad: [],
    defensaActiva: true, iniciativaArma: false, miedo: { max: 5, contra: "aplomo", pierde: "salud" }
  }
};

/** Union de todas las habilidades: el esquema de datos las guarda todas, cada ficha enseña las de su conjunto. */
export const CLAVES_HABILIDAD = [...new Set([...Object.keys(HABILIDADES_SRD), ...Object.keys(HABILIDADES_IMSERSO), ...Object.keys(HABILIDADES_DY)])];
export const CLAVES_ATRIBUTO = ["car", "des", "fue", "int", "per"];
export const CLAVES_ATAQUE = [...new Set([...Object.keys(ATAQUES_SRD), ...Object.keys(ATAQUES_IMSERSO), ...Object.keys(ATAQUES_DY), ...Object.keys(ALIAS_ATAQUE)])];

/* ------------------------------------------------------------------ */
/* Variantes de ambientación                                          */
/* ------------------------------------------------------------------ */

/**
 * Cada variante = conjunto de reglas + apariencia + reglas opcionales que recomienda.
 * `poderes`: qué sistema de poder usa (SRD «Magia y poderes»); `pulp`: Anexo Pulp.
 */
export const VARIANTES = {
  base: { label: "Ysystem3 SRD", tema: "srd", conjunto: "srd", marca: "YSYSTEM 3", sub: "SRD", poderes: null, pulp: false, reglas: [] },
  pulp: { label: "Anexo Pulp", tema: "pulp", conjunto: "srd", marca: "YSYSTEM 3", sub: "¡PULP!", poderes: null, pulp: true, reglas: ["soltarCita"] },
  fantasiaHeroica: { label: "Fantasía heroica", tema: "fantasia", conjunto: "srd", marca: "YSYSTEM 3", sub: "Fantasía heroica", poderes: "magia", pulp: false, reglas: ["noquear"] },
  cienciaFiccion: { label: "Ciencia ficción espacial", tema: "scifi", conjunto: "srd", marca: "YSYSTEM 3", sub: "Ciencia ficción", poderes: "psionica", pulp: false, reglas: ["superPunteria"] },
  lovecraft: { label: "Horror lovecraftiano", tema: "lovecraft", conjunto: "srd", marca: "YSYSTEM 3", sub: "Horror lovecraftiano", poderes: "magia", pulp: false, reglas: ["panicoAmpliado", "tortura"] },
  capaEspada: { label: "Capa y espada", tema: "capa", conjunto: "srd", marca: "YSYSTEM 3", sub: "Capa y espada", poderes: null, pulp: false, reglas: ["duelos", "noquear", "soltarCita"] },
  ciberpunk: { label: "Ciberpunk", tema: "ciberpunk", conjunto: "srd", marca: "YSYSTEM 3", sub: "Ciberpunk", poderes: "psionica", pulp: false, reglas: ["superPunteria", "tortura"] },
  terrorContemporaneo: { label: "Terror contemporáneo", tema: "terror", conjunto: "srd", marca: "YSYSTEM 3", sub: "Terror contemporáneo", poderes: null, pulp: false, reglas: ["panicoAmpliado", "tortura"] },
  dungeonsYayos: {
    label: "Dungeons & Yayos", tema: "dungeons", conjunto: "dungeonsYayos", marca: "", sub: "", poderes: null, pulp: false, reglas: [],
    logo: `${RUTA}/assets/dungeons-yayos-logo.webp`
  },
  imserso: {
    label: "IMSERSO to the Limit", tema: "imserso", conjunto: "imserso", marca: "IMSERSO", sub: "To the Limit", poderes: null, pulp: false, reglas: [],
    logo: `${RUTA}/assets/imserso/branding/imserso-logo.webp`
  }
};

/** Reglas opcionales (los «hacks» del libro de Ysystem no son oficiales; las marcadas «SRD» sí). */
export const REGLAS_OPCIONALES = {
  criticosResistencia: { label: "Críticos y pifias en Resistencia", hint: "SRD (opcional): dos 6 recuperan 1 punto, tres 6 recuperan 1D; dos 1 hacen perder 1 punto más, tres 1 matan o dejan sin cordura." },
  habituarse: { label: "Acostumbrarse al horror", hint: "SRD (opcional): cada tirada de pánico repetida contra el mismo horror baja un dado de gravedad." },
  noquear: { label: "Noquear", hint: "Hack del libro de Ysystem: apuntar con 1D en cuerpo a cuerpo, daño a la mitad y Resistencia física con 1D menos (en el SRD de Ysystem3 ya forma parte de las reglas)." },
  convalecencias: { label: "Convalecencias más realistas", hint: "Hack del libro de Ysystem: la curación por día se divide a la mitad." },
  noMorir: { label: "PJ que no pueden morir", hint: "Hack del libro de Ysystem (PJ niños): con 0 de Salud el PJ queda fuera de la historia pero no muere." },
  soltarCita: { label: "Soltar la cita tiene premio", hint: "Hack del libro de Ysystem: una proeza cuando el jugador dice la cita de su PJ en el momento oportuno." },
  panicoAmpliado: { label: "Pérdida crítica de Estabilidad", hint: "Hack del libro de Ysystem (lovecraftiano): pánico de 1 a 10 dados y Resistencia mental penalizada como la física." },
  tortura: { label: "Reglamento de tortura", hint: "SRD (opcional): mecánica de dos tiradas (Conversación e Intimidación) contra el Aplomo." },
  duelos: { label: "Subsistema de duelos", hint: "Hack del libro de Ysystem (capa y espada): estados de ventaja que se ceden en lugar de recibir el golpe." },
  superPunteria: { label: "Superpuntería", hint: "Hack del libro de Ysystem: superar la Agilidad por 10 o más hace que el disparo alcance a un segundo oponente." }
};

/* ------------------------------------------------------------------ */
/* Ayudas de acceso a la configuración                                */
/* ------------------------------------------------------------------ */

export const conjuntoDe = clave => CONJUNTOS[clave] ?? CONJUNTOS.srd;
export const varianteDe = clave => VARIANTES[clave] ?? VARIANTES.base;

/** Habilidades que enseña un conjunto, ordenadas por etiqueta. */
export const habilidadesOrdenadas = conjunto => Object.entries(conjunto.habilidades).sort(([, a], [, b]) => a.label.localeCompare(b.label, "es"));

/** Normaliza un mapa de habilidades a 1-3D (las que falten valen 1D). */
export function normalizarHabilidades(origen = {}) {
  const hab = Object.fromEntries(CLAVES_HABILIDAD.map(k => [k, { dados: 1 }]));
  for (const [k, v] of Object.entries(origen ?? {})) {
    if (!hab[k]) continue;
    const d = Number(v?.dados ?? v ?? 1);
    hab[k].dados = Math.min(3, Math.max(1, Number.isFinite(d) ? d : 1));
  }
  return hab;
}

export function etiquetaHabilidad(clave, conjunto = CONJUNTOS.srd) {
  return conjunto.habilidades[clave]?.label ?? HABILIDADES_SRD[clave]?.label ?? HABILIDADES_DY[clave]?.label ?? HABILIDADES_IMSERSO[clave]?.label ?? clave;
}

export function etiquetaAtributo(clave, conjunto = CONJUNTOS.srd) {
  return conjunto.atributos[clave]?.short ?? ATRIBUTOS_SRD[clave]?.short ?? String(clave).toUpperCase();
}

/** Resuelve el tipo de ataque de un arma al conjunto vigente (armas del SRD en IMSERSO, etc.). */
export function tipoAtaque(tipo, conjunto = CONJUNTOS.srd) {
  const t = ALIAS_ATAQUE[tipo] ?? tipo;
  if (conjunto.ataques[t]) return t;
  if (conjunto.id === "imserso") {
    return { desarmadoEspecial: "sinArmas", desarmado: "sinArmas", cuerpoUnaMano: "cuerpo", cuerpoDosManos: "cuerpo", fuegoCorto: "fuegoPequena", fuegoLargo: "fuegoGrande", fuegoLetal: "fuegoGrande", extramortifero: "fuegoGrande" }[t] ?? "fuegoPequena";
  }
  if (conjunto.id === "dungeonsYayos") {
    return { desarmadoEspecial: "desarmado", sinArmas: "desarmado", cuerpo: "cuerpoUnaMano" }[t] ?? "distancia";
  }
  return "desarmado";
}
