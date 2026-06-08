export const IMSERSO = {
  ID: "ysystem3-srd",
  title: "YSYSTEM3 SRD",
  actorTypes: {
    personaje: { label: "PJ" },
    pnj: { label: "PNJ" }
  },
  variants: {
    base: {
      label: "YSYSTEM3 SRD",
      themeClass: "ys-theme-base",
      ruleset: "srd",
      logoMark: "YSYSTEM 3",
      logoScript: "SRD",
      resource: "Proezas",
      resistancePhysical: "Resistencia fisica",
      resistanceMental: "Resistencia mental",
      fixed: {
        agilidad: "Agilidad",
        aplomo: "Aplomo",
        perspicacia: "Perspicacia"
      }
    },
    pulp: {
      label: "Anexo Pulp",
      themeClass: "ys-theme-pulp",
      ruleset: "pulp",
      logoMark: "YSYSTEM 3",
      logoScript: "Anexo Pulp",
      resource: "Proezas",
      resistancePhysical: "Resistencia fisica",
      resistanceMental: "Resistencia mental",
      fixed: {
        agilidad: "Agilidad",
        aplomo: "Aplomo",
        perspicacia: "Perspicacia"
      }
    },
    fantasiaHeroica: {
      label: "Fantasia heroica",
      themeClass: "ys-theme-fantasia",
      logoMark: "YSYSTEM 3",
      logoScript: "Fantasia heroica",
      resource: "Proezas",
      resistancePhysical: "Resistencia fisica",
      resistanceMental: "Resistencia mental",
      fixed: {
        agilidad: "Agilidad",
        aplomo: "Aplomo",
        perspicacia: "Perspicacia"
      }
    },
    cienciaFiccion: {
      label: "Ciencia ficcion espacial",
      themeClass: "ys-theme-scifi",
      logoMark: "YSYSTEM 3",
      logoScript: "Ciencia ficcion espacial",
      resource: "Proezas",
      resistancePhysical: "Resistencia fisica",
      resistanceMental: "Resistencia mental",
      fixed: {
        agilidad: "Agilidad",
        aplomo: "Aplomo",
        perspicacia: "Perspicacia"
      }
    },
    lovecraft: {
      label: "Horror lovecraftiano",
      themeClass: "ys-theme-lovecraft",
      logoMark: "YSYSTEM 3",
      logoScript: "Horror lovecraftiano",
      resource: "Proezas",
      resistancePhysical: "Resistencia fisica",
      resistanceMental: "Resistencia mental",
      fixed: {
        agilidad: "Agilidad",
        aplomo: "Aplomo",
        perspicacia: "Perspicacia"
      }
    },
    capaEspada: {
      label: "Capa y espada",
      themeClass: "ys-theme-capa",
      logoMark: "YSYSTEM 3",
      logoScript: "Capa y espada",
      resource: "Proezas",
      resistancePhysical: "Resistencia fisica",
      resistanceMental: "Resistencia mental",
      fixed: {
        agilidad: "Agilidad",
        aplomo: "Aplomo",
        perspicacia: "Perspicacia"
      }
    },
    ciberpunk: {
      label: "Ciberpunk",
      themeClass: "ys-theme-ciberpunk",
      logoMark: "YSYSTEM 3",
      logoScript: "Ciberpunk",
      resource: "Proezas",
      resistancePhysical: "Resistencia fisica",
      resistanceMental: "Resistencia mental",
      fixed: {
        agilidad: "Agilidad",
        aplomo: "Aplomo",
        perspicacia: "Perspicacia"
      }
    },
    terrorContemporaneo: {
      label: "Terror contemporaneo",
      themeClass: "ys-theme-terror",
      logoMark: "YSYSTEM 3",
      logoScript: "Terror contemporaneo",
      resource: "Proezas",
      resistancePhysical: "Resistencia fisica",
      resistanceMental: "Resistencia mental",
      fixed: {
        agilidad: "Agilidad",
        aplomo: "Aplomo",
        perspicacia: "Perspicacia"
      }
    },
    dungeonsYayos: {
      label: "Dungeons & Yayos",
      themeClass: "ys-theme-dungeons",
      ruleset: "dungeonsYayos",
      logoMark: "",
      logoScript: "",
      logoPath: "systems/ysystem3-srd/assets/dungeons-yayos-logo.webp",
      resource: "Yayopoints",
      resistancePhysical: "Jamacuco",
      resistanceMental: "Nervio",
      fixed: {
        agilidad: "Bemoles",
        aplomo: "Nervio",
        perspicacia: "Vista"
      }
    },
  },
  /** Reglas Ysystem3 SRD (Walhalla Ediciones) */
  srd: {
    maxDicePool: 5,
    defaultDifficulty: 9,
    mediaDifficulty: 10,
    iniciativaFormula: "1d6 + @atributos.des + @atributos.int"
  },
  atributos: {
    car: { label: "Carisma", short: "CAR" },
    des: { label: "Destreza", short: "DES" },
    fue: { label: "Fuerza", short: "FUE" },
    int: { label: "Inteligencia", short: "INT" },
    per: { label: "Percepcion", short: "PER" }
  },
  atributosDungeonsYayos: {
    int: { label: "Cacumen", short: "CAC" },
    car: { label: "Gracejo", short: "GRA" },
    des: { label: "Presteza", short: "PRE" },
    fue: { label: "Robustez", short: "ROB" }
  },
  habilidades: {
    atletismo: { label: "Atletismo", atributo: "des", oposicion: "agilidad" },
    auxilio: { label: "Auxilio", atributo: "int", oposicion: "" },
    conducir: { label: "Conducir", atributo: "des", oposicion: "agilidad" },
    conversacion: { label: "Conversacion", atributo: "car", oposicion: "aplomo" },
    cultura: { label: "Cultura", atributo: "int", oposicion: "" },
    entorno: { label: "Entorno", atributo: "per", oposicion: "" },
    fuerzaBruta: { label: "Fuerza bruta", atributo: "fue", oposicion: "agilidad" },
    idiomaExtranjero1: { label: "Idioma extranjero I", atributo: "int", oposicion: "" },
    idiomaExtranjero2: { label: "Idioma extranjero II", atributo: "int", oposicion: "" },
    informacion: { label: "Informacion", atributo: "int", oposicion: "" },
    intimidacion: { label: "Intimidacion", atributo: "car", oposicion: "aplomo" },
    lucha: { label: "Lucha", atributo: "des", oposicion: "agilidad" },
    mecanica: { label: "Mecanica", atributo: "int", oposicion: "" },
    memoria: { label: "Memoria", atributo: "int", oposicion: "" },
    observacion: { label: "Observacion", atributo: "per", oposicion: "agilidad" },
    ocultacion: { label: "Ocultacion", atributo: "des", oposicion: "perspicacia" },
    oido: { label: "Oido", atributo: "per", oposicion: "agilidad" },
    psicologia: { label: "Psicologia", atributo: "per", oposicion: "aplomo" },
    punteria: { label: "Punteria", atributo: "per", oposicion: "agilidad" },
    rastreo: { label: "Rastreo", atributo: "per", oposicion: "" },
    seduccion: { label: "Seduccion", atributo: "car", oposicion: "aplomo" },
    sigilo: { label: "Sigilo", atributo: "des", oposicion: "perspicacia" },
    simulacion: { label: "Simulacion", atributo: "car", oposicion: "perspicacia" },
    supervivencia: { label: "Supervivencia", atributo: "per", oposicion: "" }
  },
  habilidadesDungeonsYayos: {
    atletismo: { label: "Atletismo", atributo: "des", oposicion: "agilidad" },
    lanzamiento: { label: "Lanzamiento", atributo: "des", oposicion: "agilidad" },
    robar: { label: "Robar", atributo: "des", oposicion: "perspicacia" },
    batallitas: { label: "Batallitas", atributo: "car", oposicion: "" },
    magiaPotagia: { label: "Magia Potagia", atributo: "int", oposicion: "" },
    salero: { label: "Salero", atributo: "car", oposicion: "aplomo" },
    cerrojosTrampas: { label: "Cerrojos y Trampas", atributo: "des", oposicion: "" },
    medicina: { label: "Medicina", atributo: "int", oposicion: "" },
    sapiencia: { label: "Sapiencia", atributo: "int", oposicion: "" },
    cosasCampo: { label: "Cosas del Campo", atributo: "des", oposicion: "" },
    memoria: { label: "Memoria", atributo: "int", oposicion: "" },
    silbido: { label: "Silbido", atributo: "car", oposicion: "aplomo" },
    cotilleo: { label: "Cotilleo", atributo: "car", oposicion: "perspicacia" },
    mulaParda: { label: "Mula Parda", atributo: "fue", oposicion: "agilidad" },
    tollinas: { label: "Tollinas", atributo: "fue", oposicion: "agilidad" },
    discusion: { label: "Discusion", atributo: "car", oposicion: "aplomo" },
    nietos: { label: "Nietos", atributo: "des", oposicion: "" },
    vista: { label: "Vista", atributo: "int", oposicion: "agilidad" },
    ingesta: { label: "Ingesta", atributo: "fue", oposicion: "" },
    oido: { label: "Oido", atributo: "int", oposicion: "agilidad" }
  },
  dificultades: [
    { value: 5, label: "5-6 Muy facil" },
    { value: 7, label: "7-8 Facil" },
    { value: 9, label: "9-10 Media (habitual)" },
    { value: 11, label: "11-13 Desafiante" },
    { value: 14, label: "14-17 Dificil" },
    { value: 18, label: "18-21 Muy dificil" },
    { value: 22, label: "22-25 Extrema" }
  ],
  ataqueTipos: {
    desarmado: {
      label: "Desarmado normal",
      habilidad: "lucha",
      dano: 1,
      atributo: "fue",
      mitadAtributo: true,
      apuntar: "1d6",
      maxProezasDano: 2
    },
    desarmadoEspecial: {
      label: "Desarmado especial (artes marciales, nudillos…)",
      habilidad: "lucha",
      dano: 2,
      atributo: "fue",
      mitadAtributo: true,
      apuntar: "1d6",
      maxProezasDano: 2
    },
    cuerpoUnaMano: {
      label: "Arma cuerpo a cuerpo (1 mano)",
      habilidad: "lucha",
      dano: 3,
      atributo: "fue",
      apuntar: "1d6",
      maxProezasDano: 2
    },
    cuerpoDosManos: {
      label: "Arma cuerpo a cuerpo (2 manos)",
      habilidad: "lucha",
      dano: 3,
      atributo: "fue",
      attrMultiplier: 1.5,
      apuntar: "1d6",
      maxProezasDano: 2
    },
    distancia: {
      label: "Arma a distancia (no fuego)",
      habilidad: "punteria",
      dano: 3,
      atributo: "per",
      apuntar: "2d6",
      maxProezasDano: 2
    },
    fuegoCorto: {
      label: "Arma de fuego corta / bláster pequeño",
      habilidad: "punteria",
      dano: 7,
      atributo: "per",
      apuntar: "2d6",
      maxProezasDano: 3
    },
    fuegoLargo: {
      label: "Arma de fuego larga (rifle, escopeta, SMG, bláster)",
      habilidad: "punteria",
      dano: 11,
      atributo: "per",
      apuntar: "2d6",
      maxProezasDano: 3
    },
    fuegoLetal: {
      label: "Arma de fuego letal (ametralladora, fusil asalto, francotirador)",
      habilidad: "punteria",
      dano: 15,
      atributo: "per",
      apuntar: "2d6",
      maxProezasDano: 3
    }
  },
  /** Compatibilidad con tipos de ataque del fork anterior */
  ataqueTiposLegacy: {
    cuerpoLigera: "cuerpoUnaMano",
    cuerpoPesada: "cuerpoDosManos",
    fuegoLaser: "fuegoLetal"
  },
  ataqueTiposDungeonsYayos: {
    desarmado: {
      label: "Tollina desarmada",
      habilidad: "tollinas",
      dano: 1,
      atributo: "fue",
      apuntar: "1d6",
      maxProezasDano: 2
    },
    cuerpoUnaMano: {
      label: "Arma cuerpo a cuerpo",
      habilidad: "tollinas",
      dano: 3,
      atributo: "fue",
      apuntar: "1d6",
      maxProezasDano: 2
    },
    cuerpoDosManos: {
      label: "Arma cuerpo a cuerpo a dos manos",
      habilidad: "tollinas",
      dano: 5,
      atributo: "fue",
      apuntar: "1d6",
      maxProezasDano: 2
    },
    distancia: {
      label: "Arma de proyectiles",
      habilidad: "lanzamiento",
      dano: 3,
      atributo: "fue",
      apuntar: "2d6",
      maxProezasDano: 2
    },
    hechizoOfensivo: {
      label: "Hechizo ofensivo",
      habilidad: "magiaPotagia",
      dano: 3,
      atributo: "fue",
      apuntar: "0",
      maxProezasDano: 2
    }
  },
  saludUmbrales: [16, 11, 7, 4, 2],
  estabilidadUmbrales: [16, 11, 7, 4, 2]
};

function bySpanishLabel(entries) {
  return entries.sort(([, a], [, b]) => String(a.label ?? "").localeCompare(String(b.label ?? ""), "es", { sensitivity: "base" }));
}

function sortedByLabel(object) {
  return Object.fromEntries(bySpanishLabel(Object.entries(object ?? {})));
}

export function allSkills() {
  return sortedByLabel({ ...IMSERSO.habilidades, ...IMSERSO.habilidadesDungeonsYayos });
}

export function allSkillKeys() {
  return Object.keys(allSkills());
}

export function attributesForRuleset(ruleset = currentRuleset()) {
  return ruleset === "dungeonsYayos" ? IMSERSO.atributosDungeonsYayos : IMSERSO.atributos;
}

export function skillsForRuleset(ruleset = currentRuleset()) {
  return sortedByLabel(ruleset === "dungeonsYayos" ? IMSERSO.habilidadesDungeonsYayos : IMSERSO.habilidades);
}

export function skillConfig(key, ruleset = currentRuleset()) {
  return skillsForRuleset(ruleset)?.[key] ?? allSkills()[key] ?? null;
}

export function attackTypesForRuleset(ruleset = currentRuleset()) {
  return ruleset === "dungeonsYayos" ? IMSERSO.ataqueTiposDungeonsYayos : IMSERSO.ataqueTipos;
}

export function defaultSkills(fill = 1) {
  return Object.fromEntries(allSkillKeys().map((key) => [key, { dados: fill }]));
}

export function normalizeSkills(source = {}) {
  const skills = defaultSkills(1);
  for (const [key, value] of Object.entries(source ?? {})) {
    if (!skills[key]) continue;
    const n = Number(value?.dados ?? value ?? 1);
    skills[key].dados = Math.min(3, Math.max(1, Number.isFinite(n) ? n : 1));
  }
  return skills;
}

export function labelForSkill(key) {
  return skillConfig(key)?.label ?? key;
}

export function labelForAttribute(key) {
  return attributesForRuleset()?.[key]?.short ?? IMSERSO.atributos[key]?.short ?? key?.toUpperCase?.() ?? key;
}

export function resolveAttackType(tipo) {
  return IMSERSO.ataqueTiposLegacy?.[tipo] ?? tipo;
}

export function attackConfig(tipo) {
  const key = resolveAttackType(tipo);
  const types = attackTypesForRuleset();
  return types[key] ?? IMSERSO.ataqueTipos[key] ?? IMSERSO.ataqueTipos.desarmado;
}

export function attackAttributeDamage(attackCfg, rawAttr, ruleset = currentRuleset()) {
  const v = Number(rawAttr) || 0;
  if (ruleset === "dungeonsYayos") return v;
  if (attackCfg?.mitadAtributo) return Math.floor(v / 2);
  if (attackCfg?.attrMultiplier === 1.5) return Math.floor(v * 1.5);
  return v;
}

export function saludUmbralesForRuleset(ruleset = "srd") {
  if (ruleset === "pulp") return IMSERSO.saludUmbrales.filter((t) => t !== 16);
  return IMSERSO.saludUmbrales;
}

export function estabilidadUmbralesForRuleset(ruleset = "srd") {
  if (ruleset === "pulp") return IMSERSO.estabilidadUmbrales.filter((t) => t !== 16);
  return IMSERSO.estabilidadUmbrales;
}

export function currentRuleset() {
  const key = globalThis.game?.settings?.get?.(IMSERSO.ID, "variant") ?? "base";
  return IMSERSO.variants[key]?.ruleset ?? "srd";
}
