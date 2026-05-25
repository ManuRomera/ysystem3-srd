import { IMSERSO, defaultSkills, labelForAttribute, labelForSkill, normalizeSkills } from "./config.mjs";
import { ARQUETIPOS, archetypeSkills, archetypeSystem, archetypeTalentItem, arquetipoByKey } from "./arquetipos-data.mjs";

const ApplicationV1 = foundry.appv1?.api?.Application ?? globalThis.Application;

const ATTR_VALUES = [0, 1, 2, 4, 6];
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
const RANDOM = {
  nombres: ["Aamir al-Yasin", "Clara Vento", "Dario Montalvo", "Elena Roque", "Iria Salcedo", "Marcos Dalmau", "Nadia Corbera", "Tomas Ariza"],
  perfiles: ["Artesano veterano", "Investigadora independiente", "Escolta discreto", "Medica de campo", "Contrabandista menor", "Erudita local", "Piloto improvisado", "Interprete de confianza"],
  lugares: ["Granada", "Valencia", "Lisboa", "Marsella", "Toledo", "Tanger", "Zaragoza", "un enclave fronterizo"],
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

function shuffle(array) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function keepExistingName(name, fallback) {
  const value = String(name ?? "").trim();
  if (!value || /^(nuevo|nueva|actor|personaje|pj|pnj)\b/i.test(value)) return fallback;
  return value;
}

function legalDefaultAttributes() {
  return { car: 0, des: 1, fue: 2, int: 4, per: 6 };
}

function normalizeAttributes(source = {}, { legal = true } = {}) {
  const fallback = legal ? legalDefaultAttributes() : { car: 0, des: 0, fue: 0, int: 0, per: 0 };
  return Object.fromEntries(Object.keys(IMSERSO.atributos).map((key) => [key, number(source?.[key], fallback[key])]));
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
  const attrKeys = Object.keys(IMSERSO.atributos);
  const attrValues = shuffle(ATTR_VALUES);
  const attrs = Object.fromEntries(attrKeys.map((key, index) => [key, attrValues[index]]));
  const skillKeys = shuffle(Object.keys(IMSERSO.habilidades));
  const skills = defaultSkills(1);
  for (const key of skillKeys.slice(0, 4)) skills[key] = { dados: 3 };
  for (const key of skillKeys.slice(4, 12)) skills[key] = { dados: 2 };
  const healthRoll = await new Roll("1d6").evaluate({ async: true });
  return {
    name: keepExistingName(base.name, choice(RANDOM.nombres)),
    atributos: attrs,
    habilidades: skills,
    healthRoll: healthRoll.total,
    defectos: { leve: choice(DEFECTOS_LEVES), grave: choice(DEFECTOS_GRAVES) },
    datos: {
      jugador: base.datos?.jugador ?? game.user.name ?? "",
      lugarNacimiento: choice(RANDOM.lugares),
      edad: `${18 + Math.floor(Math.random() * 48)}`,
      profesion: choice(RANDOM.perfiles),
      perfil: "Creacion aleatoria SRD",
      motivacion: choice(RANDOM.motivaciones),
      descripcionFisica: choice(RANDOM.fisico),
      situacionFamiliar: choice(RANDOM.familia)
    },
    selected3: skillKeys.slice(0, 4),
    selected2: skillKeys.slice(4, 12)
  };
}

async function generateRandomPnjState(base) {
  const attrKeys = Object.keys(IMSERSO.atributos);
  const attrs = Object.fromEntries(attrKeys.map((key) => [key, Math.floor(Math.random() * 5)]));
  const skillKeys = shuffle(Object.keys(IMSERSO.habilidades));
  const skills = defaultSkills(1);
  for (const key of skillKeys.slice(0, 2)) skills[key] = { dados: 3 };
  for (const key of skillKeys.slice(2, 7)) skills[key] = { dados: 2 };
  const healthRoll = await new Roll("1d6").evaluate({ async: true });
  return {
    name: keepExistingName(base.name, choice(RANDOM.nombres)),
    atributos: attrs,
    habilidades: skills,
    healthRoll: healthRoll.total,
    pnj: {
      rol: choice(RANDOM.pnjRoles),
      bando: choice(RANDOM.pnjBandos),
      descripcion: choice(RANDOM.pnjDescripcion),
      notas: `Especialidades: ${skillKeys.slice(0, 7).map(labelForSkill).join(", ")}.`
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
    const steps = this.steps.map((step, index) => ({
      ...step,
      index,
      active: index === this.state.step,
      done: index < this.state.step
    }));
    const effective = this._effectiveBuild();
    const counts = this._selectedSkillCounts();
    const skillRows = Object.entries(IMSERSO.habilidades).map(([key, cfg]) => {
      const dice = number(this.state.habilidades?.[key]?.dados, 1);
      return {
        key,
        label: cfg.label,
        attr: labelForAttribute(cfg.atributo),
        dice,
        lock2: this.state.actorType === "personaje" && counts.d2 >= 8 && dice !== 2,
        lock3: this.state.actorType === "personaje" && counts.d3 >= 4 && dice !== 3
      };
    });
    return {
      state: this.state,
      actor: this.actor,
      themeClass: currentThemeClass(),
      isPnj: this.state.actorType === "pnj",
      steps,
      stepKey: this.steps[this.state.step]?.key ?? "datos",
      arquetipos: ARQUETIPOS.map((entry) => ({ ...entry, selected: entry.key === this.state.arquetipoKey })),
      selectedArquetipo: arquetipoByKey(this.state.arquetipoKey),
      atributos: Object.entries(IMSERSO.atributos).map(([key, cfg]) => ({
        key,
        label: cfg.label,
        short: cfg.short,
        value: number(this.state.atributos?.[key], 0),
        options: (this.state.actorType === "pnj" ? [0, 1, 2, 3, 4, 5, 6] : ATTR_VALUES).map((value) => ({
          value,
          label: value ? `+${value}` : "0"
        }))
      })),
      habilidades: skillRows,
      selected3: counts.d3,
      selected2: counts.d2,
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
        const swapKey = Object.keys(IMSERSO.atributos).find((other) => other !== key && number(this.state.atributos?.[other], -1) === selected);
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
      if (this.state.actorType === "personaje" && rank === 3 && previous !== 3 && counts.d3 > 4) {
        this.state.habilidades[key] = { dados: previous };
        ui.notifications.warn("Ya hay 4 habilidades a 3D. Baja otra habilidad antes de subir esta.");
      }
      if (this.state.actorType === "personaje" && rank === 2 && previous !== 2 && counts.d2 > 8) {
        this.state.habilidades[key] = { dados: previous };
        ui.notifications.warn("Ya hay 8 habilidades a 2D. Baja otra habilidad antes de subir esta.");
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
    const rows = Object.values(habilidades ?? {});
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
    this.state.arquetipoKey = String(data.get("arquetipoKey") ?? this.state.arquetipoKey);
    for (const key of Object.keys(this.state.datos)) this.state.datos[key] = String(data.get(`datos.${key}`) ?? this.state.datos[key] ?? "");
    for (const key of Object.keys(this.state.pnj)) this.state.pnj[key] = String(data.get(`pnj.${key}`) ?? this.state.pnj[key] ?? "");
    for (const key of Object.keys(IMSERSO.atributos)) {
      const field = `atributos.${key}`;
      if (data.has(field)) this.state.atributos[key] = number(data.get(field), this.state.atributos[key]);
    }
    for (const key of Object.keys(IMSERSO.habilidades)) {
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
    this.state.defectos.leve = choice(DEFECTOS_LEVES);
    this.state.defectos.grave = choice(DEFECTOS_GRAVES);
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
      await ChatMessage.create({
        speaker: this.actor ? ChatMessage.getSpeaker({ actor: this.actor }) : { alias: "Creador YSYSTEM3" },
        content: `
          <div class="ims-chat-card">
            <h3>PJ aleatorio preparado</h3>
            <p><strong>${escapeHtml(this.state.name)}</strong> · ${escapeHtml(this.state.datos.profesion)}.</p>
            <p><strong>Salud inicial:</strong> ${generated.healthRoll} en 1D6.</p>
            <p><strong>3D:</strong> ${escapeHtml(generated.selected3.map(labelForSkill).join(", "))}.</p>
            <p><strong>2D:</strong> ${escapeHtml(generated.selected2.map(labelForSkill).join(", "))}.</p>
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
    this.render(false);
  }

  _effectiveBuild() {
    const arquetipo = this.state.actorType === "personaje" && this.state.mode === "arquetipo" ? arquetipoByKey(this.state.arquetipoKey) : null;
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
      agilidad: calcAgilidad(attrs, skills),
      aplomo: calcAplomo(attrs),
      perspicacia: calcPerspicacia(attrs),
      proezas: arquetipo?.proezas ?? Math.floor((number(attrs.fue, 0) + number(attrs.int, 0)) / 2) + 3,
      puntoGuion: 1
    };
  }

  _warnings(effective, counts) {
    const warnings = [];
    if (!this.state.name.trim()) warnings.push("Falta el nombre.");
    if (!this.state.healthRoll) warnings.push("Falta tirar o generar la Salud inicial con 1D6.");
    if (this.state.actorType === "personaje") {
      if (this.state.mode === "arquetipo" && !effective.arquetipo) warnings.push("Selecciona un arquetipo.");
      if (["libre", "aleatorio"].includes(this.state.mode)) {
        const values = Object.values(this.state.atributos).map((value) => number(value, -1));
        if (new Set(values).size !== 5 || !ATTR_VALUES.every((value) => values.includes(value))) warnings.push("Reparte una vez cada valor de atributo: 0, +1, +2, +4 y +6.");
        if (counts.d3 !== 4) warnings.push(`Selecciona exactamente 4 habilidades a 3D. Ahora: ${counts.d3}.`);
        if (counts.d2 !== 8) warnings.push(`Selecciona exactamente 8 habilidades a 2D. Ahora: ${counts.d2}.`);
      }
      if (!this.state.defectos.leve.trim() || !this.state.defectos.grave.trim()) warnings.push("Faltan defecto leve y defecto grave.");
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
