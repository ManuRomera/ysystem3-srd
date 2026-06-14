import {
  IMSERSO,
  allSkillKeys,
  attributesForRuleset,
  defaultSkills,
  labelForAttribute,
  labelForSkill,
  normalizeSkills,
  skillsForRuleset,
  currentRuleset
} from "./config.mjs";
import { ARQUETIPOS, archetypeSkills, archetypeSystem, archetypeTalentItem, arquetipoByKey } from "./arquetipos-data.mjs";
import { IMSERSO_GENERATOR_DATA } from "./imserso-generator-data.mjs";

const ApplicationV1 = foundry.appv1?.api?.Application ?? globalThis.Application;

const ATTR_VALUES = [0, 1, 2, 4, 6];
const DUNGEONS_ATTR_VALUES = [0, 2, 4, 6];
const DEFECTOS_LEVES = [
  "Impulsivo cuando alguien cuestiona su criterio.",
  "Demasiado confiado con las personas amables.",
  "No soporta dejar una pregunta sin respuesta.",
  "Habla de mas cuando se siente observado.",
  "Se distrae con cualquier detalle fuera de lugar.",
  "Tiene una deuda pendiente que intenta ocultar."
];
const DEFECTOS_GRAVES = [
  "Una lealtad peligrosa le obliga a escoger mal bajo presion.",
  "Arrastra una culpa antigua que otros pueden usar contra el.",
  "Necesita demostrar que vale aunque la situacion aconseje retirarse.",
  "Una fobia concreta bloquea sus mejores decisiones.",
  "Ha prometido proteger a alguien por encima de la prudencia.",
  "Tiene un enemigo que conoce demasiado bien sus debilidades."
];
const GENERATOR_BASE = {
  nombres: ["Aamir al-Yasin", "Clara Vento", "Dario Montalvo", "Elena Roque", "Iria Salcedo", "Marcos Dalmau", "Nadia Corbera", "Tomas Ariza", "Vera Cifuentes", "Leo Sastre", "Mara Bellver", "Hugo Alcaide"],
  apodos: ["la Prudente", "el Incansable", "la del Mapa", "el de la Mala Idea", "la del Juramento", "el del Silencio"],
  perfiles: ["Artesano veterano", "Investigadora independiente", "Escolta discreto", "Medica de campo", "Contrabandista menor", "Erudita local", "Piloto improvisado", "Interprete de confianza"],
  especialidades: ["con reputacion discutible", "con una deuda antigua", "con contactos peligrosos", "con demasiada curiosidad", "con un secreto familiar", "con fama de resolver lo imposible"],
  lugares: ["Granada", "Valencia", "Lisboa", "Marsella", "Toledo", "Tanger", "Zaragoza", "un enclave fronterizo", "un barrio portuario", "una estacion olvidada"],
  motivaciones: [
    "Quiere saldar una deuda sin perder lo que le queda de honor.",
    "Busca una verdad concreta, aunque incomode a gente poderosa.",
    "Protege a su gente con mas determinacion que prudencia.",
    "Necesita dinero rapido y ha elegido una mala semana para conseguirlo.",
    "Persigue una pista personal que nadie mas considera importante."
  ],
  fisico: [
    "Mirada alerta, ropa practica y manos acostumbradas al trabajo.",
    "Aspecto discreto, voz baja y cicatrices pequenas en los nudillos.",
    "Presencia cuidada, gesto amable y una tension dificil de esconder.",
    "Ropa de viaje, equipo gastado y una calma que parece ensayada."
  ],
  familia: [
    "Familia cercana, pero cansada de sus ausencias.",
    "Pocos vinculos estables y demasiados favores pendientes.",
    "Una persona dependiente de sus decisiones le complica cada riesgo.",
    "Mantiene correspondencia con alguien que no puede visitar."
  ],
  pnjRoles: ["Informante", "Guardia", "Rival", "Aliado circunstancial", "Especialista", "Testigo", "Secuaz", "Autoridad local"],
  pnjBandos: ["Neutral", "Aliado", "Hostil", "Dudoso", "Oposicion menor", "Victima", "Obstaculo"],
  pnjDescripcion: [
    "Tiene una informacion util y una razon para no entregarla gratis.",
    "Esta en la escena para complicar las decisiones sin dominarla.",
    "Actua con nerviosismo, pero no necesariamente con mala fe.",
    "Parece secundario hasta que se descubre lo que sabe.",
    "Quiere sobrevivir al conflicto y elegir el bando ganador."
  ]
};
const GENERATOR_VARIANTS = {
  pulp: {
    perfiles: ["Reportera temeraria", "Aventurero con gabardina", "Piloto de hidroavion", "Ocultista de salon", "Boxeador retirado", "Arqueologa de campo", "Detective privado", "Inventora autodidacta"],
    especialidades: ["con un mapa incompleto", "con una reliquia maldita", "con un patrocinador dudoso", "con titulares pendientes"],
    lugares: ["Shanghai", "El Cairo", "La Habana", "Nueva York", "una isla sin cartografiar", "un tren nocturno"],
    motivaciones: ["Quiere publicar la exclusiva antes de que la censuren.", "Busca una reliquia que nadie deberia despertar.", "Necesita limpiar el nombre de una vieja amistad.", "Persigue una expedicion desaparecida."],
    pnjRoles: ["Maton de club", "Magnate sospechoso", "Guia local", "Piloto rival", "Espia de opereta", "Cultista elegante"]
  },
  fantasiaHeroica: {
    perfiles: ["Mercenaria juramentada", "Sanadora errante", "Aprendiz de torre", "Explorador de frontera", "Noble desterrado", "Guardabosques", "Bardo de taberna", "Herrera de clan"],
    especialidades: ["con una espada heredada", "con un pacto incomodo", "con un linaje discutido", "con promesas de gloria"],
    lugares: ["una ciudad amurallada", "el Valle de los Robles", "una frontera nevada", "un puerto de corsarios", "la torre del viejo camino"],
    motivaciones: ["Quiere recuperar un nombre familiar manchado.", "Busca una cura para una maldicion menor pero persistente.", "Necesita demostrar su valor ante su compania.", "Protege un juramento que otros dan por perdido."],
    pnjRoles: ["Mercader de reliquias", "Capitan de guardia", "Hechicera local", "Tabernero informado", "Bandido arrepentido", "Noble menor"]
  },
  cienciaFiccion: {
    perfiles: ["Piloto orbital", "Tecnica de soporte vital", "Diplomatico de frontera", "Cazarrecompensas", "Mineraloga de asteroides", "Medico de nave", "IA legalmente confusa", "Contrabandista de datos"],
    especialidades: ["con licencia caducada", "con implantes baratos", "con una nave hipotecada", "con acceso a canales negros"],
    lugares: ["Cinturon de Eos", "Estacion Mirlo", "Colonia Nadir", "Puerto Lagrange", "un carguero de tercera mano"],
    motivaciones: ["Quiere pagar el oxigeno del mes sin vender a nadie.", "Busca una coordenada borrada de todos los mapas.", "Necesita escapar de una corporacion propietaria.", "Quiere demostrar que la senal no era un error."],
    pnjRoles: ["Oficial portuario", "Tecnico de esclusas", "Pirata de datos", "Colono agotado", "Ejecutiva corporativa", "Mecanico de drones"]
  },
  lovecraft: {
    perfiles: ["Anticuario nervioso", "Profesora de folklore", "Medico de sanatorio", "Periodista local", "Bibliotecaria nocturna", "Marinero retirado", "Fotografa forense", "Heredera intranquila"],
    especialidades: ["con suenos recurrentes", "con cartas sin remitente", "con una mancha en el expediente", "con miedo a los sotanos"],
    lugares: ["Arkham", "Dunwich", "Kingsport", "una pension costera", "un archivo universitario", "un pueblo que no sale en mapas"],
    motivaciones: ["Quiere saber por que su familia quemaba los diarios.", "Busca a alguien que desaparecio tras leer un expediente.", "Necesita cerrar una investigacion antes del amanecer.", "Sospecha que una muerte natural no tuvo nada de natural."],
    pnjRoles: ["Conserje palido", "Sacerdote evasivo", "Paciente lucidissimo", "Profesor retirado", "Pescador supersticioso", "Agente funerario"]
  },
  capaEspada: {
    perfiles: ["Duelista sin padrino", "Espia de corte", "Comediante con daga", "Capitana sin barco", "Noble arruinado", "Mosquetera", "Confesor indiscreto", "Alquimista teatral"],
    especialidades: ["con una carta sellada", "con enemigos en palacio", "con una deuda de honor", "con demasiados amantes"],
    lugares: ["Paris", "Madrid", "Venecia", "un palacio de verano", "una taberna junto al rio", "un convento discreto"],
    motivaciones: ["Quiere vengar un insulto sin provocar una guerra.", "Debe entregar una carta antes del baile.", "Persigue un secreto que vale mas que una corona.", "Necesita salvar a alguien condenado por politica."],
    pnjRoles: ["Guardia de palacio", "Dama intrigante", "Duelista contratado", "Criado con informacion", "Embajador sospechoso", "Tabernera leal"]
  },
  ciberpunk: {
    perfiles: ["Hacker de barrio", "Mensajera cromada", "Medica clandestina", "Exseguridad corporativo", "Artista de realidad aumentada", "Netrunner sin licencia", "Chatarrera de drones", "Abogada de pobres"],
    especialidades: ["con firmware ilegal", "con un patrocinador toxico", "con recuerdos editados", "con deuda de clinica"],
    lugares: ["Distrito Neon", "Bloque 88", "Puerto de Datos", "subsuelo corporativo", "azoteas de lluvia acida", "mercado de implantes"],
    motivaciones: ["Quiere liberar una prueba antes de que la borren.", "Necesita comprar un cuerpo nuevo para alguien querido.", "Busca al tecnico que altero sus recuerdos.", "Pretende tumbar una torre desde dentro."],
    pnjRoles: ["Fixer", "Maton aumentado", "Ejecutiva de zona", "Vendedora de implantes", "Drone con dueno oculto", "Periodista pirata"]
  },
  terrorContemporaneo: {
    perfiles: ["Paramedica agotada", "Profesor sustituto", "Policia de pueblo", "Streamer de sucesos", "Operaria nocturna", "Psicologa escolar", "Tecnico de emergencias", "Conserje de hospital"],
    especialidades: ["con una llamada perdida", "con llaves de sitios prohibidos", "con trauma reciente", "con intuicion para lo raro"],
    lugares: ["un motel de carretera", "un hospital comarcal", "un instituto cerrado", "una urbanizacion sin cobertura", "un bosque recreativo", "un poligono abandonado"],
    motivaciones: ["Quiere encontrar a una persona desaparecida antes de la policia.", "Necesita terminar el turno sin otra muerte inexplicable.", "Sabe que la version oficial no encaja.", "Pretende sacar a su familia del pueblo esta noche."],
    pnjRoles: ["Vecina asustada", "Sheriff cansado", "Tecnico de camaras", "Paciente alterado", "Conductor perdido", "Encargada de gasolinera"]
  }
};
const DUNGEONS_RACES = [
  { label: "Humano", min: 68, max: 96, alignments: ["legal refunfunon", "neutral cansado", "bueno de baston facil"] },
  { label: "Enano", min: 185, max: 312, alignments: ["legal testarudo", "neutral de taberna", "bueno con rodilleras"] },
  { label: "Elfo", min: 620, max: 920, alignments: ["caotico nostalgico", "neutral insoportable", "bueno pero con siesta larga"] },
  { label: "Mediano", min: 102, max: 168, alignments: ["legal merendero", "neutral merendador", "bueno de doble desayuno"] },
  { label: "Gnomo", min: 210, max: 355, alignments: ["caotico inventor", "neutral chisposo", "bueno con cataratas magicas"] },
  { label: "Semielfo", min: 155, max: 240, alignments: ["neutral melodramatico", "bueno elegante", "caotico de reunion familiar"] },
  { label: "Semiorco", min: 74, max: 112, alignments: ["legal sorprendentemente educado", "neutral grunon", "bueno de abrazo peligroso"] },
  { label: "Tiefling", min: 92, max: 146, alignments: ["caotico con reuma", "neutral de cuerno pulido", "bueno aunque no lo parezca"] }
];
const DUNGEONS_PROFILE = {
  nombres: ["Baldomero", "Rigoberta", "Apolonio", "Gertrudis", "Anacleto", "Filomena", "Casilda", "Eustaquio", "Maruja", "Venancio", "Herminia", "Gumersindo", "Petronila", "Celedonio"],
  apellidos: ["del Baston Roto", "Catarata de Plata", "Matadragones Jubilado", "de la Siesta Eterna", "Sopasombra", "del Bingo Arcano", "Rodillafirme", "Nietobane", "del Caldero Flojo", "Reumatrueno"],
  clases: ["guerrero jubilado", "cleriga de ambulatorio", "picara de ventanilla", "mago de manual grande", "barbara de residencia", "bardo de sobremesa", "druida de huerto urbano", "paladina de la queja formal", "explorador de pasillo", "monje de aquagym"],
  manias: ["odia las escaleras de caracol", "lleva caramelos de menta sagrada", "duerme con la armadura puesta", "discute con las antorchas", "recuerda la mazmorra de antes", "exige descuento de jubilacion en cada taberna"],
  lugares: ["la Residencia del Grifo", "el Club del Dado Dorado", "Villa Cataplasma", "las Termas del Kobold", "el Hogar del Beholder Tuerto", "el Reino de la Paga Extra", "la Cripta con Ascensor", "el Balneario de los Mil Limos"],
  motivaciones: [
    "Quiere recuperar una dentadura magica antes de que despierte al lich equivocado.",
    "Busca demostrar a sus nietos que aun puede saquear una mazmorra sin GPS.",
    "Necesita pagar una derrama de la residencia con tesoro de dragon.",
    "Ha confundido la excursion cultural con una gesta epica y ya no piensa retirarse.",
    "Persigue al monstruo que le robo la silla plegable encantada."
  ],
  fisico: [
    "Postura orgullosa, rodillas traicioneras y una mirada que ya ha visto demasiados goblins fiscales.",
    "Arrastra una mochila llena de remedios, reliquias y bocadillos envueltos en papel.",
    "Viste equipo heroico remendado con lana, cuero viejo y parches de excursiones pasadas.",
    "Camina despacio hasta que alguien menciona tesoro, turno de cena o descuentos."
  ],
  familia: [
    "Sus nietos creen que juega a las cartas; nadie les ha explicado lo de las catacumbas.",
    "Tiene familia en tres reinos y discusiones pendientes en todos.",
    "Recibe mensajes por paloma, cristal y grupo familiar, ninguno tranquilizador.",
    "Prometio volver antes de la merienda y ya lleva dos reinos de retraso."
  ],
  pnjRoles: ["Jubilado rival", "Goblin fisioterapeuta", "Dragona administradora", "Tabernera de residencia", "Nieto preocupado", "Clerigo de guardia", "Reina pensionista", "Limo de mantenimiento"],
  pnjBandos: ["Quiere evitar papeleo", "Aliado si hay merienda", "Hostil por error administrativo", "Neutral hasta la hora de la siesta", "Defiende una cola", "Protege un descuento"],
  pnjDescripcion: [
    "Tiene mas informacion que paciencia y solo habla si alguien se sienta a escuchar.",
    "Confunde protocolo de mazmorra con normas de comunidad, pero manda mucho.",
    "Parece inofensivo hasta que recuerda donde guardo el arma buena.",
    "Ofrece ayuda, reproches y una historia larguisima en el mismo turno."
  ]
};

const STEPS_PJ = [
  { key: "modo", label: "Metodo" },
  { key: "datos", label: "Datos" },
  { key: "reglas", label: "Reglas" },
  { key: "defectos", label: "Defectos" },
  { key: "resumen", label: "Resumen" }
];
const STEPS_PNJ = [
  { key: "datos", label: "Datos" },
  { key: "reglas", label: "Reglas" },
  { key: "resumen", label: "Resumen" }
];

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  return foundry.utils.deepClone(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function choice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle(array) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function currentVariantKey() {
  return globalThis.game?.settings?.get?.(IMSERSO.ID, "variant") ?? "base";
}

function generatorProfile() {
  const key = currentVariantKey();
  if (key === "dungeonsYayos") return DUNGEONS_PROFILE;
  const specific = GENERATOR_VARIANTS[key] ?? {};
  return {
    ...GENERATOR_BASE,
    ...specific,
    nombres: specific.nombres ?? GENERATOR_BASE.nombres,
    apodos: specific.apodos ?? GENERATOR_BASE.apodos,
    perfiles: specific.perfiles ?? GENERATOR_BASE.perfiles,
    especialidades: specific.especialidades ?? GENERATOR_BASE.especialidades,
    lugares: specific.lugares ?? GENERATOR_BASE.lugares,
    motivaciones: specific.motivaciones ?? GENERATOR_BASE.motivaciones,
    fisico: specific.fisico ?? GENERATOR_BASE.fisico,
    familia: specific.familia ?? GENERATOR_BASE.familia,
    pnjRoles: specific.pnjRoles ?? GENERATOR_BASE.pnjRoles,
    pnjBandos: specific.pnjBandos ?? GENERATOR_BASE.pnjBandos,
    pnjDescripcion: specific.pnjDescripcion ?? GENERATOR_BASE.pnjDescripcion
  };
}

function variantLabel() {
  const key = currentVariantKey();
  return IMSERSO.variants[key]?.label ?? IMSERSO.variants.base.label;
}

function capitalize(val) {
  return val ? val.charAt(0).toUpperCase() + val.slice(1) : "";
}

function imsersoIdentity(kind = "pj") {
  const first = choice(IMSERSO_GENERATOR_DATA.firstNames);
  const surname = choice(IMSERSO_GENERATOR_DATA.surnames);
  const nickname = Math.random() < 0.55 ? ` "${choice(IMSERSO_GENERATOR_DATA.nicknames)}"` : "";
  const name = `${first} ${surname}${nickname}`;
  const role = choice(IMSERSO_GENERATOR_DATA.formerProfessions);
  const place = choice(IMSERSO_GENERATOR_DATA.origins);
  const achaque = choice(IMSERSO_GENERATOR_DATA.achaques);
  const achaqueMenor = choice(IMSERSO_GENERATOR_DATA.achaques.filter((entry) => entry !== achaque)) || achaque;
  const talante = choice(IMSERSO_GENERATOR_DATA.attitudes);
  const aficion = choice(IMSERSO_GENERATOR_DATA.hobbies);
  const objetivo = choice(IMSERSO_GENERATOR_DATA.tripGoals);
  const arquetipo = choice(IMSERSO_GENERATOR_DATA.pjArchetypes);
  const mania = choice(IMSERSO_GENERATOR_DATA.quirks);

  if (kind === "pnj") {
    const pnjRol = choice(IMSERSO_GENERATOR_DATA.npcRoles);
    const secreto = choice(IMSERSO_GENERATOR_DATA.npcSecrets);
    const colectivo = choice(IMSERSO_GENERATOR_DATA.namesPNJCollectives);
    const places = [
      "recepcion del hotel", "autobus de excursion", "comedor del buffet",
      "salon de bingo", "paseo maritimo", "balneario", "mercadillo local",
      "museo municipal", "verbena nocturna", "consulta del centro de salud",
      "bar de la esquina", "cola del ascensor"
    ];
    const pnjLugar = choice(places);
    return {
      name: `${choice(IMSERSO_GENERATOR_DATA.firstNames)} ${choice(IMSERSO_GENERATOR_DATA.surnames)}`,
      role: pnjRol,
      bando: talante,
      description: `${capitalize(talante)}; ${mania}. Suele aparecer en ${pnjLugar}.`,
      notes: `Secreto: ${secreto}. Vinculo: ${colectivo}.`
    };
  }

  return {
    name,
    place,
    age: `${63 + Math.floor(Math.random() * 22)}`,
    profession: role,
    profile: arquetipo,
    motivation: `Objetivo del viaje: ${objetivo}.`,
    physical: `${capitalize(talante)}. Afición: ${aficion}. Achaque visible: ${achaque}.`,
    family: `Viaja desde ${place}; ${mania}.`,
    achaqueMayor: achaque,
    achaqueMenor: achaqueMenor,
    quirk: mania
  };
}

function genericIdentity(kind = "pj") {
  const profile = generatorProfile();
  const name = `${choice(profile.nombres)} ${choice(profile.apodos)}`;
  const role = choice(profile.perfiles);
  const detail = choice(profile.especialidades);
  const place = choice(profile.lugares);
  const profileText = `${variantLabel()} · ${detail}`;
  if (kind === "pnj") {
    return {
      name,
      role: choice(profile.pnjRoles),
      bando: choice(profile.pnjBandos),
      description: `${choice(profile.pnjDescripcion)} ${choice(profile.fisico)}`,
      notes: `${role} ${detail}. Procede de ${place}. Motivacion: ${choice(profile.motivaciones)}`
    };
  }
  return {
    name,
    place,
    age: `${randomInt(18, 68)}`,
    profession: `${role} ${detail}`,
    profile: profileText,
    motivation: choice(profile.motivaciones),
    physical: choice(profile.fisico),
    family: choice(profile.familia)
  };
}

function dungeonsIdentity(kind = "pj") {
  const race = choice(DUNGEONS_RACES);
  const age = randomInt(race.min, race.max);
  const alignment = choice(race.alignments);
  const name = `${choice(DUNGEONS_PROFILE.nombres)} ${choice(DUNGEONS_PROFILE.apellidos)}`;
  const role = choice(DUNGEONS_PROFILE.clases);
  const quirk = choice(DUNGEONS_PROFILE.manias);
  const place = choice(DUNGEONS_PROFILE.lugares);
  if (kind === "pnj") {
    return {
      name,
      role: `${choice(DUNGEONS_PROFILE.pnjRoles)} ${race.label}`,
      bando: choice(DUNGEONS_PROFILE.pnjBandos),
      description: `${choice(DUNGEONS_PROFILE.pnjDescripcion)} Tiene ${age} años, es ${race.label.toLowerCase()} ${alignment} y ${quirk}.`,
      notes: `Raza/alineamiento: ${race.label} ${alignment}. Oficio: ${role}. Lugar: ${place}.`
    };
  }
  return {
    name,
    place: race.label,
    age: `${age}`,
    profession: `${role} (${quirk})`,
    profile: alignment,
    motivation: choice(DUNGEONS_PROFILE.motivaciones),
    physical: choice(DUNGEONS_PROFILE.fisico),
    family: `${choice(DUNGEONS_PROFILE.familia)} Procede de ${place}.`
  };
}

function randomIdentity(kind = "pj") {
  const ruleset = currentRuleset();
  if (ruleset === "imserso") return imsersoIdentity(kind);
  return isDungeonsYayos() ? dungeonsIdentity(kind) : genericIdentity(kind);
}

function keepExistingName(name, fallback) {
  const value = String(name ?? "").trim();
  if (!value || /^(nuevo|nueva|actor|personaje|pj|pnj)\b/i.test(value)) return fallback;
  return value;
}

function legalDefaultAttributes() {
  const values = attrValuesForRuleset();
  return Object.fromEntries(Object.keys(attributesForRuleset()).map((key, index) => [key, values[index] ?? 0]));
}

function zeroAttributesForRuleset() {
  return Object.fromEntries(Object.keys(attributesForRuleset()).map((key) => [key, 0]));
}

function attrValuesForRuleset() {
  const ruleset = currentRuleset();
  return ruleset === "dungeonsYayos" || ruleset === "imserso" ? DUNGEONS_ATTR_VALUES : ATTR_VALUES;
}

function attrValuesText() {
  return attrValuesForRuleset().map((value) => (value ? `+${value}` : "0")).join(", ");
}

function isDungeonsYayos() {
  return currentRuleset() === "dungeonsYayos";
}

function isImserso() {
  return currentRuleset() === "imserso";
}

function normalizeAttributes(source = {}, { legal = true } = {}) {
  const fallback = legal ? legalDefaultAttributes() : zeroAttributesForRuleset();
  return Object.fromEntries(Object.keys(attributesForRuleset()).map((key) => [key, number(source?.[key], fallback[key])]));
}

function calcAgilidad(attrs, skills) {
  return number(skills.atletismo?.dados, 1) * 3 + number(attrs.des, 0);
}

function calcAplomo(attrs) {
  return number(attrs.car, 0) + number(attrs.int, 0) + 5;
}

function calcPerspicacia(attrs) {
  return number(attrs.int, 0) + number(attrs.per, 0) + 5;
}

function calcRf(attrs) {
  return 12 - number(attrs.fue, 0);
}

function calcRm(attrs) {
  return 12 - number(attrs.car, 0);
}

function calcHealth(attrs, roll) {
  return 10 + number(attrs.fue, 0) * 2 + number(roll, 0);
}

function calcStability(attrs) {
  return number(attrs.car, 0) + number(attrs.int, 0) + 16;
}

function calcBemoles(attrs) {
  return number(attrs.int, 0) + 7;
}

function calcNervio(attrs, skills = {}) {
  return number(skills.atletismo?.dados, 1) * 3 + number(attrs.des, 0);
}

function calcYayopoints(attrs) {
  return Math.floor((number(attrs.int, 0) + number(attrs.fue, 0)) / 2) + 2;
}

function skillTargetsForRuleset() {
  return isDungeonsYayos() || isImserso() ? { d3: 4, d2: 6 } : { d3: 4, d2: 8 };
}

function defaultState(actor = null, type = actor?.type ?? "personaje") {
  const sys = actor?.system ?? {};
  const arquetipo = arquetipoByKey(sys.datos?.arquetipo);
  return {
    actorType: type === "pnj" ? "pnj" : "personaje",
    name: actor?.name ?? (type === "pnj" ? "Nuevo PNJ" : "Nuevo PJ"),
    img: actor?.img ?? "icons/svg/mystery-man.svg",
    mode: type === "pnj" ? "aleatorio" : (arquetipo ? "arquetipo" : "libre"),
    step: 0,
    arquetipoKey: arquetipo?.key ?? "",
    healthRoll: "",
    datos: {
      jugador: sys.datos?.jugador ?? game.user.name ?? "",
      lugarNacimiento: sys.datos?.lugarNacimiento ?? "",
      edad: sys.datos?.edad ?? "",
      profesion: sys.datos?.profesion ?? "",
      perfil: sys.datos?.perfil ?? "",
      motivacion: sys.datos?.motivacion ?? "",
      descripcionFisica: sys.datos?.descripcionFisica ?? "",
      situacionFamiliar: sys.datos?.situacionFamiliar ?? ""
    },
    pnj: {
      rol: sys.rol ?? "",
      bando: sys.bando ?? "",
      descripcion: sys.descripcion ?? "",
      notas: sys.notas ?? ""
    },
    atributos: normalizeAttributes(sys.atributos, { legal: type !== "pnj" }),
    habilidades: normalizeSkills(sys.habilidades && Object.keys(sys.habilidades).length ? sys.habilidades : defaultSkills(1)),
    defectos: {
      leve: sys.defectos?.leve ?? "",
      grave: sys.defectos?.grave ?? ""
    }
  };
}

async function generateRandomState(base) {
  const identity = randomIdentity("pj");
  const attrKeys = Object.keys(attributesForRuleset());
  const attrValues = shuffle(attrValuesForRuleset());
  const attrs = Object.fromEntries(attrKeys.map((key, index) => [key, attrValues[index]]));
  const skillKeys = shuffle(Object.keys(skillsForRuleset()));
  const skills = defaultSkills(1);
  const targets = skillTargetsForRuleset();
  for (const key of skillKeys.slice(0, targets.d3)) skills[key] = { dados: 3 };
  for (const key of skillKeys.slice(targets.d3, targets.d3 + targets.d2)) skills[key] = { dados: 2 };
  const healthRoll = await new Roll("1d6").evaluate({ async: true });
  const isIms = currentRuleset() === "imserso";
  return {
    name: keepExistingName(base.name, identity.name),
    atributos: attrs,
    habilidades: skills,
    healthRoll: healthRoll.total,
    defectos: isIms ? {
      leve: `Achaque menor: ${identity.achaqueMenor}.`,
      grave: `Achaque mayor: ${identity.achaqueMayor}. Mania: ${identity.quirk}.`
    } : {
      leve: choice(DEFECTOS_LEVES),
      grave: choice(DEFECTOS_GRAVES)
    },
    datos: {
      jugador: base.datos?.jugador ?? game.user.name ?? "",
      lugarNacimiento: identity.place,
      edad: identity.age,
      profesion: identity.profession,
      perfil: identity.profile,
      motivacion: identity.motivation,
      descripcionFisica: identity.physical,
      situacionFamiliar: identity.family
    },
    selected3: skillKeys.slice(0, targets.d3),
    selected2: skillKeys.slice(targets.d3, targets.d3 + targets.d2)
  };
}

async function generateRandomPnjState(base) {
  const identity = randomIdentity("pnj");
  const attrKeys = Object.keys(attributesForRuleset());
  const attrs = Object.fromEntries(attrKeys.map((key) => [key, Math.floor(Math.random() * 5)]));
  const skillKeys = shuffle(Object.keys(skillsForRuleset()));
  const skills = defaultSkills(1);
  for (const key of skillKeys.slice(0, 2)) skills[key] = { dados: 3 };
  for (const key of skillKeys.slice(2, 7)) skills[key] = { dados: 2 };
  const healthRoll = await new Roll("1d6").evaluate({ async: true });
  return {
    name: keepExistingName(base.name, identity.name),
    atributos: attrs,
    habilidades: skills,
    healthRoll: healthRoll.total,
    pnj: {
      rol: identity.role,
      bando: identity.bando,
      descripcion: identity.description,
      notas: `${identity.notes} Especialidades: ${skillKeys.slice(0, 7).map(labelForSkill).join(", ")}.`
    }
  };
}

export class YsystemCharacterCreator extends ApplicationV1 {
  constructor(actorOrOptions = null, options = {}) {
    const actor = actorOrOptions?.documentName === "Actor" ? actorOrOptions : null;
    const actorType = actorOrOptions?.type && !actor ? actorOrOptions.type : actor?.type;
    super(options);
    this.actor = actor;
    this.state = defaultState(actor, actorType);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ysystem3-character-creator",
      classes: ["imserso", "ims-creator-app", "ys-creator-app"],
      title: "Creador guiado YSYSTEM3",
      template: `systems/${IMSERSO.ID}/templates/apps/character-creator.hbs`,
      width: 940,
      height: 720,
      resizable: true
    });
  }

  get title() {
    const kind = this.state.actorType === "pnj" ? "PNJ" : "PJ";
    return this.actor ? `Creador ${kind} · ${this.actor.name}` : `Creador guiado de ${kind}`;
  }

  async _render(force, options) {
    this._captureScroll();
    await super._render(force, options);
    if (this._resetScroll) {
      this._resetScroll = false;
      this._scrollToTop();
    } else {
      this._restoreScroll();
    }
  }

  get steps() {
    return this.state.actorType === "pnj" ? STEPS_PNJ : STEPS_PJ;
  }

  getData() {
    const ruleset = currentRuleset();
    const isDungeons = ruleset === "dungeonsYayos";
    const isIms = ruleset === "imserso";
    if ((isDungeons || isIms) && this.state.mode === "arquetipo") this.state.mode = "libre";
    const steps = this.steps.map((step, index) => ({
      ...step,
      label: (isDungeons || isIms) && step.key === "defectos" ? "Achaques" : step.label,
      index,
      active: index === this.state.step,
      done: index < this.state.step
    }));
    const effective = this._effectiveBuild();
    const counts = this._selectedSkillCounts();
    const skillTargets = skillTargetsForRuleset();
    const skillRows = Object.entries(skillsForRuleset()).map(([key, cfg]) => {
      const dice = number(this.state.habilidades?.[key]?.dados, 1);
      return {
        key,
        label: cfg.label,
        attr: labelForAttribute(cfg.atributo),
        dice,
        lock2: this.state.actorType === "personaje" && counts.d2 >= skillTargets.d2 && dice !== 2,
        lock3: this.state.actorType === "personaje" && counts.d3 >= skillTargets.d3 && dice !== 3
      };
    });
    return {
      state: this.state,
      actor: this.actor,
      themeClass: currentThemeClass(),
      isPnj: this.state.actorType === "pnj",
      isDungeonsYayos: isDungeons,
      isImserso: isIms,
      supportsArchetypes: !isDungeons && !isIms,
      attrValuesText: attrValuesText(),
      attrRequirementText: isDungeons || isIms ? "Reparte 0, +2, +4 y +6 entre los cuatro atributos." : "Reparte 0, +1, +2, +4 y +6 entre atributos.",
      resourceLabel: isDungeons || isIms ? "Yayopoints" : "Proezas",
      agilityLabel: isDungeons ? "Bemoles" : (isIms ? "Nervio" : "Agilidad"),
      aplomoLabel: isDungeons ? "Nervio" : (isIms ? "Bemoles" : "Aplomo"),
      perspicaciaLabel: isDungeons ? "Vista" : (isIms ? "Ojo clínico" : "Perspicacia"),
      rfLabel: isDungeons || isIms ? "Jamacuco" : "RF",
      professionLabel: isDungeons ? "Antigua profesion (+3)" : (isIms ? "Antiguo oficio (+3)" : "Profesion / perfil (+3)"),
      profileLabel: isDungeons ? "Alineamiento" : (isIms ? "Arquetipo de jubilado" : "Ambientacion"),
      ageLabel: isDungeons ? "Años" : "Edad",
      originLabel: isDungeons ? "Raza" : "Lugar de nacimiento",
      minorDefectLabel: isDungeons || isIms ? "Achaque menor" : "Defecto leve",
      majorDefectLabel: isDungeons || isIms ? "Achaque mayor" : "Defecto grave",
      defectsTitle: isDungeons || isIms ? "Achaques y Salud inicial" : "Defectos y Salud inicial",
      steps,
      stepKey: this.steps[this.state.step]?.key ?? "datos",
      arquetipos: ARQUETIPOS.map((entry) => ({ ...entry, selected: entry.key === this.state.arquetipoKey })),
      selectedArquetipo: arquetipoByKey(this.state.arquetipoKey),
      atributos: Object.entries(attributesForRuleset()).map(([key, cfg]) => ({
        key,
        label: cfg.label,
        short: cfg.short,
        value: number(this.state.atributos?.[key], 0),
        options: (this.state.actorType === "pnj" ? [0, 1, 2, 3, 4, 5, 6] : attrValuesForRuleset()).map((value) => ({
          value,
          label: value ? `+${value}` : "0"
        }))
      })),
      habilidades: skillRows,
      selected3: counts.d3,
      selected2: counts.d2,
      skill3Target: skillTargets.d3,
      skill2Target: skillTargets.d2,
      effective,
      warnings: this._warnings(effective, counts)
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-creator-step]").on("click", (event) => this._goTo(number(event.currentTarget.dataset.creatorStep, 0)));
    html.find("[data-creator-mode]").on("change", async (event) => {
      this._readForm();
      this.state.mode = event.currentTarget.value;
      if (this.state.mode === "aleatorio") await this._randomCharacter();
      else this.render(false);
    });
    html.find("[data-creator-next]").on("click", () => this._next());
    html.find("[data-creator-prev]").on("click", () => this._prev());
    html.find("[data-creator-apply]").on("click", () => this._apply());
    html.find("[data-random-character]").on("click", (event) => {
      event.preventDefault();
      this._randomCharacter();
    });
    html.find("[data-random-pnj]").on("click", (event) => {
      event.preventDefault();
      this._randomPnj();
    });
    html.find("[data-roll-health]").on("click", () => this._rollHealth());
    html.find("[data-roll-defects]").on("click", () => this._rollDefects());
    html.find("[data-attribute-bonus]").on("change", (event) => {
      const key = event.currentTarget.dataset.attributeBonus;
      const previous = number(this.state.atributos?.[key], 0);
      this._readForm();
      if (this.state.actorType === "personaje") {
        const selected = number(this.state.atributos?.[key], previous);
        const swapKey = Object.keys(attributesForRuleset()).find((other) => other !== key && number(this.state.atributos?.[other], -1) === selected);
        if (swapKey) this.state.atributos[swapKey] = previous;
      }
      this.render(false);
    });
    html.find("[data-skill-rank]").on("change", (event) => {
      const key = event.currentTarget.dataset.skillRank;
      const previous = number(this.state.habilidades?.[key]?.dados, 1);
      this._readForm();
      const rank = number(event.currentTarget.value, 1);
      this.state.habilidades[key] = { dados: rank };
      const counts = this._selectedSkillCounts();
      const skillTargets = skillTargetsForRuleset();
      if (this.state.actorType === "personaje" && rank === 3 && previous !== 3 && counts.d3 > skillTargets.d3) {
        this.state.habilidades[key] = { dados: previous };
        ui.notifications.warn(`Ya hay ${skillTargets.d3} habilidades a 3D. Baja otra habilidad antes de subir esta.`);
      }
      if (this.state.actorType === "personaje" && rank === 2 && previous !== 2 && counts.d2 > skillTargets.d2) {
        this.state.habilidades[key] = { dados: previous };
        ui.notifications.warn(`Ya hay ${skillTargets.d2} habilidades a 2D. Baja otra habilidad antes de subir esta.`);
      }
      this.render(false);
    });
    html.find("[name='arquetipoKey']").on("change", () => {
      this._readForm();
      const arquetipo = arquetipoByKey(this.state.arquetipoKey);
      if (arquetipo) {
        this.state.datos.profesion = arquetipo.perfil ?? this.state.datos.profesion;
        this.state.atributos = clone(arquetipo.attrs);
        this.state.habilidades = archetypeSkills(arquetipo);
      }
      this.render(false);
    });
  }

  _selectedSkillCounts(habilidades = this.state.habilidades) {
    const rows = Object.keys(skillsForRuleset()).map((key) => habilidades?.[key] ?? { dados: 1 });
    return {
      d3: rows.filter((row) => number(row?.dados, 1) === 3).length,
      d2: rows.filter((row) => number(row?.dados, 1) === 2).length
    };
  }

  _readForm() {
    const form = this.element?.[0]?.querySelector("form");
    if (!form) return;
    const data = new FormData(form);
    this.state.name = String(data.get("name") ?? this.state.name);
    this.state.mode = String(data.get("mode") ?? this.state.mode);
    if ((isDungeonsYayos() || isImserso()) && this.state.mode === "arquetipo") this.state.mode = "libre";
    this.state.arquetipoKey = String(data.get("arquetipoKey") ?? this.state.arquetipoKey);
    for (const key of Object.keys(this.state.datos)) this.state.datos[key] = String(data.get(`datos.${key}`) ?? this.state.datos[key] ?? "");
    for (const key of Object.keys(this.state.pnj)) this.state.pnj[key] = String(data.get(`pnj.${key}`) ?? this.state.pnj[key] ?? "");
    for (const key of Object.keys(attributesForRuleset())) {
      const field = `atributos.${key}`;
      if (data.has(field)) this.state.atributos[key] = number(data.get(field), this.state.atributos[key]);
    }
    for (const key of allSkillKeys()) {
      const field = `habilidades.${key}`;
      if (data.has(field)) this.state.habilidades[key] = { dados: number(data.get(field), this.state.habilidades[key]?.dados ?? 1) };
    }
    this.state.defectos.leve = String(data.get("defectos.leve") ?? this.state.defectos.leve ?? "");
    this.state.defectos.grave = String(data.get("defectos.grave") ?? this.state.defectos.grave ?? "");
  }

  _captureScroll() {
    const main = this.element?.[0]?.querySelector(".ims-creator-main");
    this._scrollState = { top: main?.scrollTop ?? 0, left: main?.scrollLeft ?? 0 };
  }

  _restoreScroll() {
    const state = this._scrollState;
    window.setTimeout(() => {
      const main = this.element?.[0]?.querySelector(".ims-creator-main");
      if (main) {
        main.scrollTop = state?.top ?? 0;
        main.scrollLeft = state?.left ?? 0;
      }
    }, 0);
  }

  _scrollToTop() {
    window.setTimeout(() => {
      const main = this.element?.[0]?.querySelector(".ims-creator-main");
      if (main) main.scrollTop = 0;
    }, 0);
  }

  _goTo(step) {
    this._readForm();
    this.state.step = Math.min(this.steps.length - 1, Math.max(0, step));
    this._resetScroll = true;
    this.render(false);
  }

  _next() {
    this._readForm();
    this.state.step = Math.min(this.steps.length - 1, this.state.step + 1);
    this._resetScroll = true;
    this.render(false);
  }

  _prev() {
    this._readForm();
    this.state.step = Math.max(0, this.state.step - 1);
    this._resetScroll = true;
    this.render(false);
  }

  async _rollHealth() {
    this._readForm();
    const roll = await new Roll("1d6").evaluate({ async: true });
    this.state.healthRoll = roll.total;
    await roll.toMessage({
      speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : { alias: "Creador YSYSTEM3" },
      flavor: `<div class="ims-chat-card"><h3>Salud inicial</h3><p>Resultado 1D6: <strong>${roll.total}</strong>.</p></div>`
    });
    this.render(false);
  }

  _rollDefects() {
    this._readForm();
    if (currentRuleset() === "imserso") {
      const achaqueMayor = choice(IMSERSO_GENERATOR_DATA.achaques);
      const achaqueMenor = choice(IMSERSO_GENERATOR_DATA.achaques.filter((entry) => entry !== achaqueMayor)) || achaqueMayor;
      const quirk = choice(IMSERSO_GENERATOR_DATA.quirks);
      this.state.defectos.leve = `Achaque menor: ${achaqueMenor}.`;
      this.state.defectos.grave = `Achaque mayor: ${achaqueMayor}. Mania: ${quirk}.`;
    } else {
      this.state.defectos.leve = choice(DEFECTOS_LEVES);
      this.state.defectos.grave = choice(DEFECTOS_GRAVES);
    }
    this.render(false);
  }

  async _randomCharacter({ announce = true } = {}) {
    this._readForm();
    const generated = await generateRandomState(this.state);
    this.state.mode = "aleatorio";
    this.state.name = generated.name;
    this.state.atributos = generated.atributos;
    this.state.habilidades = generated.habilidades;
    this.state.datos = { ...this.state.datos, ...generated.datos };
    this.state.healthRoll = generated.healthRoll;
    this.state.defectos = generated.defectos;
    this.state.step = this.steps.findIndex((step) => step.key === "resumen");
    if (announce) {
      const isIms = currentRuleset() === "imserso";
      const cardTitle = isIms ? "Jubilado preparado" : "PJ aleatorio preparado";
      const details = isIms ? `
        <p><strong>${escapeHtml(this.state.name)}</strong> · ${escapeHtml(this.state.datos.perfil)}.</p>
        <p><strong>Antiguo oficio:</strong> ${escapeHtml(this.state.datos.profesion)}.</p>
        <p><strong>Achaque mayor:</strong> ${escapeHtml(generated.defectos.grave)}.</p>
        <p><strong>3D:</strong> ${escapeHtml(generated.selected3.map(labelForSkill).join(", "))}.</p>
      ` : `
        <p><strong>${escapeHtml(this.state.name)}</strong> · ${escapeHtml(this.state.datos.profesion)}.</p>
        <p><strong>Salud inicial:</strong> ${generated.healthRoll} en 1D6.</p>
        <p><strong>3D:</strong> ${escapeHtml(generated.selected3.map(labelForSkill).join(", "))}.</p>
        <p><strong>2D:</strong> ${escapeHtml(generated.selected2.map(labelForSkill).join(", "))}.</p>
      `;
      await ChatMessage.create({
        speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : { alias: isIms ? "Generador de jubilados" : "Creador YSYSTEM3" },
        content: `
          <div class="ims-chat-card">
            <h3>${cardTitle}</h3>
            ${details}
          </div>`
      });
    }
    this.render(false);
  }

  async _randomPnj() {
    this._readForm();
    const generated = await generateRandomPnjState(this.state);
    this.state.name = generated.name;
    this.state.atributos = generated.atributos;
    this.state.habilidades = generated.habilidades;
    this.state.healthRoll = generated.healthRoll;
    this.state.pnj = { ...this.state.pnj, ...generated.pnj };
    this.state.step = this.steps.findIndex((step) => step.key === "resumen");
    const isIms = currentRuleset() === "imserso";
    await ChatMessage.create({
      speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : { alias: isIms ? "Generador de PNJ del viaje" : "Creador YSYSTEM3" },
      content: `
        <div class="ims-chat-card">
          <h3>${isIms ? "PNJ del viaje preparado" : "PNJ aleatorio preparado"}</h3>
          <p><strong>${escapeHtml(this.state.name)}</strong> · ${escapeHtml(this.state.pnj.rol)}.</p>
          <p><strong>Bando/Actitud:</strong> ${escapeHtml(this.state.pnj.bando)}.</p>
          <p><strong>Descripción:</strong> ${escapeHtml(this.state.pnj.descripcion)}.</p>
        </div>`
    });
    this.render(false);
  }

  _effectiveBuild() {
    const ruleset = currentRuleset();
    const isDungeons = ruleset === "dungeonsYayos";
    const isIms = ruleset === "imserso";
    const arquetipo = this.state.actorType === "personaje" && this.state.mode === "arquetipo" && !isDungeons && !isIms ? arquetipoByKey(this.state.arquetipoKey) : null;
    const attrs = arquetipo ? clone(arquetipo.attrs) : normalizeAttributes(this.state.atributos, { legal: this.state.actorType !== "pnj" });
    const skills = arquetipo ? archetypeSkills(arquetipo) : normalizeSkills(this.state.habilidades);
    const healthBase = arquetipo ? arquetipo.saludBase : 10 + number(attrs.fue, 0) * 2;
    const healthRoll = number(this.state.healthRoll, 0);
    return {
      arquetipo,
      attrs,
      skills,
      healthBase,
      healthRoll,
      health: healthBase + healthRoll,
      estabilidad: calcStability(attrs),
      rf: arquetipo?.resistenciaFisica ?? calcRf(attrs),
      rm: calcRm(attrs),
      agilidad: isDungeons ? calcBemoles(attrs) : (isIms ? calcNervio(attrs, skills) : calcAgilidad(attrs, skills)),
      aplomo: isDungeons ? calcNervio(attrs, skills) : (isIms ? calcBemoles(attrs) : calcAplomo(attrs)),
      perspicacia: isDungeons || isIms ? 0 : calcPerspicacia(attrs),
      proezas: arquetipo?.proezas ?? (isDungeons || isIms ? calcYayopoints(attrs) : Math.floor((number(attrs.fue, 0) + number(attrs.int, 0)) / 2) + 3),
      puntoGuion: isDungeons || isIms ? 0 : 1
    };
  }

  _warnings(effective, counts) {
    const warnings = [];
    if (!this.state.name.trim()) warnings.push("Falta el nombre.");
    if (!this.state.healthRoll) warnings.push("Falta tirar o generar la Salud inicial con 1D6.");
    if (this.state.actorType === "personaje") {
      if (this.state.mode === "arquetipo" && !effective.arquetipo) warnings.push("Selecciona un arquetipo.");
      if (["libre", "aleatorio"].includes(this.state.mode)) {
        const skillTargets = skillTargetsForRuleset();
        const values = Object.values(this.state.atributos).map((value) => number(value, -1));
        const expected = attrValuesForRuleset();
        if (new Set(values).size !== expected.length || !expected.every((value) => values.includes(value))) warnings.push(`Reparte una vez cada valor de atributo: ${attrValuesText()}.`);
        if (counts.d3 !== skillTargets.d3) warnings.push(`Selecciona exactamente ${skillTargets.d3} habilidades a 3D. Ahora: ${counts.d3}.`);
        if (counts.d2 !== skillTargets.d2) warnings.push(`Selecciona exactamente ${skillTargets.d2} habilidades a 2D. Ahora: ${counts.d2}.`);
      }
      if (!this.state.defectos.leve.trim() || !this.state.defectos.grave.trim()) warnings.push(isDungeonsYayos() || isImserso() ? "Faltan achaque menor y achaque mayor." : "Faltan defecto leve y defecto grave.");
    }
    return warnings;
  }

  async _apply() {
    this._readForm();
    if (this.state.actorType === "personaje" && this.state.mode === "aleatorio" && this._warnings(this._effectiveBuild(), this._selectedSkillCounts()).length) {
      await this._randomCharacter({ announce: false });
    }
    if (this.state.actorType === "pnj" && !this.state.healthRoll) await this._rollHealth();
    if (!this.state.healthRoll) await this._rollHealth();
    const effective = this._effectiveBuild();
    const warnings = this._warnings(effective, this._selectedSkillCounts());
    if (warnings.length) {
      ui.notifications.warn(warnings[0]);
      this.render(false);
      return null;
    }
    const actor = this.actor ?? await Actor.create({ name: this.state.name.trim(), type: this.state.actorType, img: this.state.img });
    const updateData = this.state.actorType === "pnj" ? this._pnjUpdateData(effective) : this._pjUpdateData(effective);
    await actor.update(updateData);
    if (this.state.actorType === "personaje" && effective.arquetipo) {
      const existingTalent = actor.items.find((item) => item.type === "talento" && item.name === effective.arquetipo.talentName);
      if (!existingTalent) await actor.createEmbeddedDocuments("Item", [archetypeTalentItem(effective.arquetipo)]);
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="ims-chat-card">
          <h3>${this.state.actorType === "pnj" ? "PNJ creado" : "PJ creado"}</h3>
          <p><strong>${escapeHtml(actor.name)}</strong> queda preparado con Salud ${effective.health}${this.state.actorType === "personaje" ? `, Proezas ${effective.proezas} y RF ${effective.rf}` : ` y RF ${effective.rf}`}.</p>
        </div>`
    });
    this.actor = actor;
    actor.sheet?.render(true);
    this.close();
    return actor;
  }

  _pjUpdateData(effective) {
    const base = {
      name: this.state.name.trim(),
      img: this.state.img,
      "system.datos.jugador": this.state.datos.jugador,
      "system.datos.lugarNacimiento": this.state.datos.lugarNacimiento,
      "system.datos.edad": this.state.datos.edad,
      "system.datos.profesion": this.state.datos.profesion,
      "system.datos.perfil": this.state.datos.perfil,
      "system.datos.motivacion": this.state.datos.motivacion,
      "system.datos.descripcionFisica": this.state.datos.descripcionFisica,
      "system.datos.situacionFamiliar": this.state.datos.situacionFamiliar,
      "system.defectos.leve": this.state.defectos.leve,
      "system.defectos.grave": this.state.defectos.grave,
      "system.defectos.leveUsado": false,
      "system.atributos": effective.attrs,
      "system.habilidades": effective.skills,
      "system.proezas.valor": effective.proezas,
      "system.proezas.inicial": effective.proezas,
      "system.puntoGuion.valor": effective.puntoGuion,
      "system.puntoGuion.max": effective.puntoGuion,
      "system.valoresManual.agilidad": isDungeonsYayos() || isImserso() ? effective.agilidad : "",
      "system.valoresManual.aplomo": isDungeonsYayos() || isImserso() ? effective.aplomo : "",
      "system.salud.valor": effective.health,
      "system.salud.max": effective.health,
      "system.resistenciaFisica.valor": effective.rf,
      "system.resistenciaFisica.primeraTirada": false,
      "system.resistenciaFisica.umbrales": { 16: false, 11: false, 7: false, 4: false, 2: false },
      "system.estabilidad.valor": effective.estabilidad,
      "system.estabilidad.max": effective.estabilidad,
      "system.resistenciaMental.valor": effective.rm,
      "system.resistenciaMental.primeraTirada": false,
      "system.resistenciaMental.umbrales": { 16: false, 11: false, 7: false, 4: false, 2: false }
    };
    if (effective.arquetipo) {
      foundry.utils.mergeObject(base, archetypeSystem(effective.arquetipo, number(this.state.healthRoll, 1)));
    } else {
      base["system.datos.arquetipo"] = this.state.mode === "aleatorio" ? "Aleatorio SRD" : "Libre";
      base["system.datos.talento"] = "";
    }
    return base;
  }

  _pnjUpdateData(effective) {
    return {
      name: this.state.name.trim(),
      img: this.state.img,
      "system.rol": this.state.pnj.rol,
      "system.bando": this.state.pnj.bando,
      "system.descripcion": this.state.pnj.descripcion,
      "system.notas": this.state.pnj.notas,
      "system.atributos": effective.attrs,
      "system.habilidades": effective.skills,
      "system.salud.valor": effective.health,
      "system.salud.max": effective.health,
      "system.agilidad.valor": effective.agilidad,
      "system.agilidad.manual": false,
      "system.aplomo.valor": effective.aplomo,
      "system.aplomo.manual": false,
      "system.perspicacia.valor": effective.perspicacia,
      "system.perspicacia.manual": false,
      "system.resistenciaFisica.valor": effective.rf,
      "system.resistenciaFisica.manual": false
    };
  }
}

function currentThemeClass() {
  const key = game.settings?.get?.(IMSERSO.ID, "variant") ?? "base";
  return IMSERSO.variants[key]?.themeClass ?? IMSERSO.variants.base.themeClass;
}

export function openCharacterCreator(actorOrOptions = null) {
  return new YsystemCharacterCreator(actorOrOptions).render(true);
}
