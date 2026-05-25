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
  saludUmbrales: [16, 11, 7, 4, 2],
  estabilidadUmbrales: [16, 11, 7, 4, 2]
};

export function defaultSkills(fill = 1) {
  return Object.fromEntries(Object.keys(IMSERSO.habilidades).map((key) => [key, { dados: fill }]));
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
  return IMSERSO.habilidades[key]?.label ?? key;
}

export function labelForAttribute(key) {
  return IMSERSO.atributos[key]?.short ?? key?.toUpperCase?.() ?? key;
}

export function resolveAttackType(tipo) {
  return IMSERSO.ataqueTiposLegacy?.[tipo] ?? tipo;
}

export function attackConfig(tipo) {
  const key = resolveAttackType(tipo);
  return IMSERSO.ataqueTipos[key] ?? IMSERSO.ataqueTipos.desarmado;
}

export function attackAttributeDamage(attackCfg, rawAttr) {
  const v = Number(rawAttr) || 0;
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
  const key = game.settings?.get?.(IMSERSO.ID, "variant") ?? "base";
  return IMSERSO.variants[key]?.ruleset ?? "srd";
}
