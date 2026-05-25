import {
  IMSERSO,
  normalizeSkills,
  labelForAttribute,
  labelForSkill,
  attackConfig,
  attackAttributeDamage,
  resolveAttackType,
  saludUmbralesForRuleset,
  estabilidadUmbralesForRuleset,
  currentRuleset
} from "./config.mjs";
import { arquetipoByKey, archetypeSystem, archetypeTalentItem } from "./arquetipos-data.mjs";
import { rollYayo, simpleDialog, rollFlavorForSkill } from "./dice.mjs";

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function numberOrFallback(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  return number(value, fallback);
}

function finiteNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value?.dados ?? value);
  return Number.isFinite(n) ? n : fallback;
}

function healthPenalty(salud) {
  const value = number(salud, 0);
  if (value < 4) return 3;
  if (value < 7) return 2;
  if (value < 11) return 1;
  return 0;
}

function calcAplomo(system) {
  return number(system.atributos?.car, 0) + number(system.atributos?.int, 0) + 5;
}

function calcAgilidad(system) {
  const atletismo = finiteNumber(system.habilidades?.atletismo?.dados, 1);
  return (atletismo * 3) + number(system.atributos?.des, 0);
}

function calcPerspicacia(system) {
  return number(system.atributos?.int, 0) + number(system.atributos?.per, 0) + 5;
}

function calcResistenciaFisica(system) {
  return 12 - number(system.atributos?.fue, 0);
}

function calcResistenciaMental(system) {
  return 12 - number(system.atributos?.car, 0);
}

function ensureThresholds(target, thresholds = [16, 11, 7, 4, 2]) {
  target.umbrales ??= {};
  for (const threshold of thresholds) target.umbrales[threshold] ??= false;
}

function prepareResource(resource, { valor = 0, max = valor } = {}) {
  const out = resource && typeof resource === "object" ? resource : {};
  out.max = numberOrFallback(out.max, max);
  out.valor = numberOrFallback(out.valor, out.max);
  return out;
}

function prepareResistance(resource, fallback) {
  const out = resource && typeof resource === "object" ? resource : {};
  out.valor = numberOrFallback(out.valor, fallback);
  out.primeraTirada = !!out.primeraTirada;
  ensureThresholds(out);
  return out;
}

function clampDice(value) {
  return Math.min(3, Math.max(1, number(value, 1)));
}

function skillDice(actor, skillKey) {
  const candidates = [
    actor.system?.efectivos?.habilidades?.[skillKey]?.dados,
    actor.system?.habilidades?.[skillKey]?.dados,
    actor.system?.habilidades?.[skillKey],
    1
  ];
  for (const candidate of candidates) {
    const n = finiteNumber(candidate, NaN);
    if (Number.isFinite(n)) return Math.min(3, Math.max(1, n));
  }
  return 1;
}

function attributeValue(actor, attrKey) {
  return finiteNumber(
    actor.system?.efectivos?.atributos?.[attrKey],
    finiteNumber(actor.system?.atributos?.[attrKey], 0)
  );
}

async function rollExplodingD6(count) {
  const safeCount = Math.max(0, number(count, 0));
  if (!safeCount) return { total: 0, rolls: [], formula: "0", faces: [] };

  let total = 0;
  const rolls = [];
  const faces = [];
  let pending = safeCount;
  while (pending > 0) {
    const roll = await new Roll(`${pending}d6`).evaluate({ async: true });
    rolls.push(roll);
    const currentFaces = roll.dice.flatMap((die) => die.results).map((result) => result.result);
    faces.push(...currentFaces);
    total += roll.total;
    pending = currentFaces.filter((face) => face === 6).length;
  }
  return { total, rolls, formula: `${safeCount}d6x`, faces };
}

function automationKey(item) {
  const raw = item?.system?.automatismo || item?.system?.uso || item?.name || "";
  return String(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function equippedItems(actor) {
  return actor.items?.filter((item) => item.system?.equipado) ?? [];
}

function equippedWeapon(actor) {
  return actor.items?.find((item) => item.type === "arma" && item.system?.equipado) ?? null;
}

function hasTalent(actor, talentName) {
  const normalized = String(talentName ?? "").toLowerCase();
  return String(actor.system?.datos?.talento ?? "").toLowerCase().includes(normalized)
    || actor.items?.some((item) => item.type === "talento" && String(item.name ?? "").toLowerCase() === normalized);
}

function emptyModifiers() {
  return {
    atributos: {},
    habilidadesAdd: {},
    habilidadesMin: {},
    nervioMin: 0,
    sinArmasDano: null,
    proteccionDano: 0,
    proteccionAgilidad: 0,
    proteccionPenalizacion: 0,
    notas: []
  };
}

function addAttr(mods, key, value) {
  mods.atributos[key] = number(mods.atributos[key], 0) + value;
}

function addSkill(mods, key, value) {
  mods.habilidadesAdd[key] = number(mods.habilidadesAdd[key], 0) + value;
}

function minSkill(mods, key, value) {
  mods.habilidadesMin[key] = Math.max(number(mods.habilidadesMin[key], 0), value);
}

function modifiersForItem(item) {
  const mods = emptyModifiers();
  if (item?.system?.equipado && item.type === "armadura") {
    const level = Math.max(0, number(item.system.nivel, 0));
    mods.proteccionDano += level;
    mods.proteccionPenalizacion += Math.floor(level / 2);
    mods.notas.push(`${item.name}: armadura ${level}, penalizador ${Math.floor(level / 2)}`);
  }
  if (item?.system?.equipado && item.type === "escudo") {
    const level = Math.max(0, number(item.system.nivel, 0));
    mods.proteccionAgilidad += level;
    mods.proteccionPenalizacion += level;
    mods.notas.push(`${item.name}: escudo +${level} Agilidad, penalizador ${level}`);
  }
  return mods;
}

function mergeModifiers(actor) {
  const merged = emptyModifiers();
  for (const item of equippedItems(actor)) {
    const mods = modifiersForItem(item);
    for (const [key, value] of Object.entries(mods.atributos)) addAttr(merged, key, value);
    for (const [key, value] of Object.entries(mods.habilidadesAdd)) addSkill(merged, key, value);
    for (const [key, value] of Object.entries(mods.habilidadesMin)) minSkill(merged, key, value);
    merged.nervioMin = Math.max(merged.nervioMin, mods.nervioMin);
    if (mods.sinArmasDano !== null) merged.sinArmasDano = Math.max(number(merged.sinArmasDano, 0), mods.sinArmasDano);
    merged.proteccionDano += number(mods.proteccionDano, 0);
    merged.proteccionAgilidad += number(mods.proteccionAgilidad, 0);
    merged.proteccionPenalizacion += number(mods.proteccionPenalizacion, 0);
    merged.notas.push(...mods.notas);
  }
  return merged;
}

function effectiveSystem(actor) {
  const base = actor.system;
  const mods = mergeModifiers(actor);
  const atributos = foundry.utils.deepClone(base.atributos ?? {});
  for (const [key, value] of Object.entries(mods.atributos)) atributos[key] = number(atributos[key], 0) + value;
  const habilidades = foundry.utils.deepClone(base.habilidades ?? {});
  for (const key of Object.keys(IMSERSO.habilidades)) {
    const current = clampDice(habilidades[key]?.dados ?? 1);
    const added = current + number(mods.habilidadesAdd[key], 0);
    habilidades[key] = { dados: Math.max(clampDice(added), number(mods.habilidadesMin[key], 0)) };
    habilidades[key].dados = clampDice(habilidades[key].dados);
  }
  return { atributos, habilidades, mods };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function firstTargetToken(actor = null) {
  const targeted = game.user.targets.first();
  if (targeted) return targeted;
  const controlled = canvas?.tokens?.controlled?.[0] ?? null;
  if (!controlled) return null;
  if (actor && controlled.actor?.uuid === actor.uuid) return null;
  return controlled;
}

function fixedValue(actor, key) {
  if (!actor || !key) return null;
  const value = actor.system?.[key];
  const fixed = typeof value === "object" ? value?.valor : value;
  const n = Number(fixed);
  return Number.isFinite(n) ? n : null;
}

function stepper(name, value, { min = 0, max = 99, step = 1 } = {}) {
  return `
    <div class="ims-stepper" data-min="${min}" data-max="${max}" data-step="${step}">
      <button type="button" data-ims-step="-1"><i class="fas fa-minus"></i></button>
      <input type="number" name="${name}" value="${value}" min="${min}" max="${max}" step="${step}" readonly>
      <button type="button" data-ims-step="1"><i class="fas fa-plus"></i></button>
    </div>`;
}

function actorAgilidad(actor) {
  if (!actor) return 8;
  const base = actor.type === "pnj" ? number(actor.system.agilidad?.valor, 8) : number(actor.system.agilidad, 8);
  const shield = number(actor.system.efectivos?.mods?.proteccionAgilidad, 0);
  const value = base + shield;
  return actor.system.combate?.sorprendido ? Math.ceil(value / 2) : value;
}

function damageCard(data) {
  const status = data.applied ? "Daño aplicado" : data.defended ? "Defensa conseguida" : "Impacto pendiente";
  const hasLinkedTarget = !!(data.targetUuid || data.targetTokenUuid);
  const buttons = data.applied || data.defended || !hasLinkedTarget ? "" : `
    <div class="ims-chat-actions">
      <button type="button" class="ims-chat-action" data-ims-action="active-defense">Defensa activa</button>
      <button type="button" class="ims-chat-action" data-ims-action="apply-damage">Aplicar daño</button>
      <button type="button" class="ims-chat-action secondary" data-ims-action="cancel-damage">Cancelar</button>
    </div>`;
  return `
    <div class="ims-chat-card ims-damage-card">
      <header><h3>${escapeHtml(data.attackLabel)}</h3><strong>${status}</strong></header>
      <p><strong>${escapeHtml(data.attackerName)}</strong> impacta a <strong>${escapeHtml(data.targetName)}</strong>.</p>
      <p>Daño calculado: <strong>${data.damage}</strong> (${escapeHtml(data.formulaText)})</p>
      ${hasLinkedTarget ? "" : "<p>Sin token vinculado: aplica el daño manualmente si procede.</p>"}
      ${data.defenseText ? `<p>${escapeHtml(data.defenseText)}</p>` : `<p>Defensa activa: Atletismo contra dificultad ${data.defenseDifficulty}.</p>`}
      ${buttons}
    </div>`;
}

function hazardCard(data) {
  const status = data.applied ? "Daño aplicado" : data.damage > 0 ? "Daño pendiente" : "Sin daño";
  const buttons = data.applied || data.damage <= 0 ? "" : `
    <div class="ims-chat-actions">
      <button type="button" class="ims-chat-action" data-ims-action="apply-hazard-damage">Aplicar daño</button>
    </div>`;
  return `
    <div class="ims-chat-card ims-damage-card">
      <header><h3>${escapeHtml(data.label)}</h3><strong>${status}</strong></header>
      <p><strong>${escapeHtml(data.targetName)}</strong>: ${escapeHtml(data.summary)}</p>
      ${data.details ? `<p>${escapeHtml(data.details)}</p>` : ""}
      ${data.damage > 0 ? `<p>Daño calculado: <strong>${data.damage}</strong> Salud.</p>` : "<p>No pierde Salud por esta resolución.</p>"}
      ${buttons}
    </div>`;
}

export class ImsersoActor extends Actor {
  prepareBaseData() {
    super.prepareBaseData();
    const sys = this.system;
    sys.habilidades = normalizeSkills(sys.habilidades);
    if (this.type === "personaje") {
      sys.atributos ??= {};
      sys.salud = prepareResource(sys.salud, { valor: 18, max: 18 });
      sys.estabilidad = prepareResource(sys.estabilidad, { valor: 18, max: 18 });
      sys.resistenciaFisica = prepareResistance(sys.resistenciaFisica, calcResistenciaFisica(sys));
      sys.resistenciaMental = prepareResistance(sys.resistenciaMental, calcResistenciaMental(sys));
      sys.proezas = prepareResource(sys.proezas, { valor: 4, max: number(sys.proezas?.inicial, 4) });
      sys.proezas.inicial = numberOrFallback(sys.proezas.inicial, sys.proezas.max);
      sys.puntoGuion = prepareResource(sys.puntoGuion, { valor: 1, max: 1 });
    }
    if (this.type === "pnj") {
      sys.atributos ??= {};
      sys.salud = prepareResource(sys.salud, { valor: 10, max: 10 });
      sys.resistenciaFisica ??= {};
      sys.resistenciaFisica.valor = numberOrFallback(sys.resistenciaFisica.valor, calcResistenciaFisica(sys));
    }
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    const sys = this.system;
    if (this.type === "personaje") this._preparePersonaje(sys);
    if (this.type === "pnj") this._preparePnj(sys);
  }

  _preparePersonaje(sys) {
    const effective = effectiveSystem(this);
    const derived = { ...sys, atributos: effective.atributos, habilidades: effective.habilidades };
    sys.efectivos = effective;
    sys.agilidad = Math.max(calcAgilidad(derived), number(effective.mods.nervioMin, 0));
    sys.aplomo = calcAplomo(derived);
    sys.perspicacia = calcPerspicacia(derived);
    sys.resistenciaFisica ??= {};
    if (!sys.resistenciaFisica?.valor) sys.resistenciaFisica.valor = calcResistenciaFisica(derived);
    sys.resistenciaFisica.efectivo = calcResistenciaFisica(derived);
    sys.resistenciaMental ??= {};
    if (!sys.resistenciaMental?.valor) sys.resistenciaMental.valor = calcResistenciaMental(derived);
    sys.resistenciaMental.efectivo = calcResistenciaMental(derived);
    sys.proteccion = {
      dano: number(effective.mods.proteccionDano, 0),
      agilidad: number(effective.mods.proteccionAgilidad, 0),
      penalizacion: number(effective.mods.proteccionPenalizacion, 0)
    };
    sys.proezas ??= { valor: 0, inicial: 0 };
    if (!sys.proezas.inicial) sys.proezas.inicial = Math.floor((number(sys.atributos?.fue, 0) + number(sys.atributos?.int, 0)) / 2) + 3;
    sys.puntoGuion ??= { valor: 1, max: 1, usado: false, nota: "" };
    sys.penalizadorDados = healthPenalty(sys.salud?.valor);
    sys.inconscienteAuto = number(sys.salud?.valor, 0) === 1;
    sys.muertoAuto = number(sys.salud?.valor, 0) <= 0;
  }

  _preparePnj(sys) {
    const effective = effectiveSystem(this);
    const derived = { ...sys, atributos: effective.atributos, habilidades: effective.habilidades };
    sys.efectivos = effective;
    if (!sys.agilidad?.manual) sys.agilidad.valor = Math.max(calcAgilidad(derived), number(effective.mods.nervioMin, 0));
    if (!sys.aplomo?.manual) sys.aplomo.valor = calcAplomo(derived);
    if (!sys.perspicacia?.manual) sys.perspicacia.valor = calcPerspicacia(derived);
    if (!sys.resistenciaFisica?.manual) sys.resistenciaFisica.valor = calcResistenciaFisica(derived);
    sys.proteccion = {
      dano: number(effective.mods.proteccionDano, 0),
      agilidad: number(effective.mods.proteccionAgilidad, 0),
      penalizacion: number(effective.mods.proteccionPenalizacion, 0)
    };
    sys.penalizadorDados = healthPenalty(sys.salud?.valor);
    sys.inconscienteAuto = number(sys.salud?.valor, 0) === 1;
    sys.muertoAuto = number(sys.salud?.valor, 0) <= 0;
  }

  async applyArchetype(key, itemSystem = null) {
    if (this.type !== "personaje") {
      ui.notifications.warn("Los arquetipos solo se aplican a fichas de PJ.");
      return null;
    }
    const baseArquetipo = arquetipoByKey(key);
    const arquetipo = this._archetypeFromItemSystem(baseArquetipo, itemSystem, key);
    if (!arquetipo) {
      ui.notifications.warn("Selecciona un arquetipo valido antes de aplicarlo.");
      return null;
    }
    const confirmed = await Dialog.confirm({
      title: `Aplicar arquetipo: ${arquetipo.name}`,
      content: `
        <form class="ims-dialog">
          <p>Esto ajustara atributos, habilidades, perfil, talento, Proezas, Salud y Resistencias segun la plantilla SRD.</p>
          <p>No cambia el nombre del PJ, jugador, fotografia ni biografia.</p>
        </form>`,
      yes: "Aplicar arquetipo",
      no: "Cancelar",
      defaultYes: false
    });
    if (!confirmed) return null;

    const healthRoll = await new Roll("1d6").evaluate({ async: true });
    await this.update(archetypeSystem(arquetipo, healthRoll.total));
    const existingTalent = this.items.find((item) => item.type === "talento" && item.name === arquetipo.talentName);
    if (!existingTalent) await this.createEmbeddedDocuments("Item", [archetypeTalentItem(arquetipo)]);
    const skills3 = arquetipo.d3.map((key) => labelForSkill(key)).join(", ");
    const skills2 = arquetipo.d2.map((key) => labelForSkill(key)).join(", ");
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [healthRoll],
      content: `
        <div class="ims-chat-card">
          <header><h3>Arquetipo aplicado</h3><strong>${escapeHtml(arquetipo.name)}</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> adopta el arquetipo <strong>${escapeHtml(arquetipo.name)}</strong>.</p>
          <p>Salud inicial: ${arquetipo.saludBase} + 1d6 (${healthRoll.total}) = <strong>${arquetipo.saludBase + healthRoll.total}</strong>. Proezas: <strong>${arquetipo.yayos}</strong>. Resistencia fisica: <strong>${arquetipo.jamacuco}</strong>.</p>
          <p><strong>3D:</strong> ${escapeHtml(skills3)}.</p>
          <p><strong>2D:</strong> ${escapeHtml(skills2)}.</p>
          <p><strong>Talento:</strong> ${escapeHtml(arquetipo.talentName)}. ${escapeHtml(arquetipo.talent)}</p>
        </div>`
    });
  }

  _archetypeFromItemSystem(baseArquetipo, itemSystem, key) {
    if (!itemSystem && baseArquetipo) {
      return {
        ...baseArquetipo,
        partido: baseArquetipo.perfil || baseArquetipo.partido || "",
        yayos: baseArquetipo.proezas ?? baseArquetipo.yayos ?? 0,
        jamacuco: baseArquetipo.resistenciaFisica ?? baseArquetipo.jamacuco ?? 10
      };
    }
    if (!itemSystem) return null;
    const attrs = itemSystem.atributos && Object.keys(itemSystem.atributos).length
      ? foundry.utils.deepClone(itemSystem.atributos)
      : foundry.utils.deepClone(baseArquetipo?.attrs ?? {});
    const d3 = Array.isArray(itemSystem.habilidades3d) && itemSystem.habilidades3d.length
      ? itemSystem.habilidades3d
      : (baseArquetipo?.d3 ?? []);
    const d2 = Array.isArray(itemSystem.habilidades2d) && itemSystem.habilidades2d.length
      ? itemSystem.habilidades2d
      : (baseArquetipo?.d2 ?? []);
    if (!baseArquetipo && !Object.keys(attrs).length) return null;
    return {
      key: itemSystem.arquetipoKey || baseArquetipo?.key || key,
      name: baseArquetipo?.name || key,
      genero: itemSystem.genero || baseArquetipo?.genero || "",
      perfil: itemSystem.perfil || itemSystem.partido || baseArquetipo?.perfil || baseArquetipo?.partido || "",
      partido: itemSystem.partido || itemSystem.perfil || baseArquetipo?.perfil || baseArquetipo?.partido || "",
      attrs,
      proezas: number(itemSystem.proezas ?? itemSystem.yayopoints, baseArquetipo?.proezas ?? baseArquetipo?.yayos ?? 0),
      yayos: number(itemSystem.proezas ?? itemSystem.yayopoints, baseArquetipo?.proezas ?? baseArquetipo?.yayos ?? 0),
      resistenciaFisica: number(itemSystem.resistenciaFisica ?? itemSystem.jamacuco, baseArquetipo?.resistenciaFisica ?? baseArquetipo?.jamacuco ?? 10),
      jamacuco: number(itemSystem.resistenciaFisica ?? itemSystem.jamacuco, baseArquetipo?.resistenciaFisica ?? baseArquetipo?.jamacuco ?? 10),
      saludBase: number(itemSystem.saludBase, baseArquetipo?.saludBase ?? 10),
      d3,
      d2,
      talentName: itemSystem.talentoNombre || baseArquetipo?.talentName || "Talento",
      talent: itemSystem.talento || baseArquetipo?.talent || "",
      description: itemSystem.descripcion || baseArquetipo?.description || ""
    };
  }

  async rollSkill(skillKey, options = {}) {
    const skill = IMSERSO.habilidades[skillKey];
    if (!skill) return;
    const attrKey = skill.atributo;
    const targetToken = firstTargetToken(this);
    const target = targetToken?.actor ?? null;
    const opposedDifficulty = skill.oposicion ? fixedValue(target, skill.oposicion) : null;
    if (skill.oposicion && !target && !options.skipDialog) {
      ui.notifications.info("Esta acción funciona mejor con un token seleccionado o tarjeteado; puedes resolverla sin token ajustando la dificultad manualmente.");
    }
    let attr = attributeValue(this, attrKey);
    if (["des", "fue"].includes(attrKey)) attr -= number(this.system.efectivos?.mods?.proteccionPenalizacion, 0);
    const baseDice = skillDice(this, skillKey);
    const defaults = {
      dificultad: options.dificultad ?? opposedDifficulty ?? IMSERSO.srd.defaultDifficulty,
      extraDados: options.extraDados ?? 0,
      bonus: options.bonus ?? 0,
      profesion: options.profesion ?? false,
      proezaDado: options.proezaDado ?? options.yayoDado ?? false,
      recuerdo: options.recuerdo ?? options.flashback ?? false,
      defectoGrave: options.defectoGrave ?? options.achaqueMayor ?? false,
      defectoLeve: options.defectoLeve ?? options.achaqueMenor ?? false,
      dadosSacrificados: options.dadosSacrificados ?? 0,
      oppositionText: opposedDifficulty ? `${target.name}: ${skill.oposicion} ${opposedDifficulty}` : ""
    };
    const data = options.skipDialog ? defaults : await this._skillDialog(skillKey, defaults);
    if (!data) return;

    let bonus = number(data.bonus, 0) + (data.profesion ? 3 : 0);
    const usesProezaDado = this.type === "personaje" && (data.proezaDado || data.yayoDado);
    let extraDice = number(data.extraDados, 0) + (usesProezaDado ? 1 : 0) + (data.recuerdo || data.flashback ? 2 : 0);
    let dice = baseDice + extraDice - number(data.dadosSacrificados, 0);
    dice -= number(this.system.penalizadorDados, 0);
    if (data.defectoGrave || data.achaqueMayor) dice -= 1;
    dice = Math.min(IMSERSO.srd.maxDicePool, Math.max(0, dice));

    if (usesProezaDado && (data.recuerdo || data.flashback)) {
      ui.notifications.warn("SRD: no puedes combinar +1D de proeza con Recuerdo cuando... en la misma tirada.");
      return null;
    }
    if (usesProezaDado && !this.canSpendProezas(1)) return null;
    if (usesProezaDado) await this.spendProezas(1);
    if (data.recuerdo || data.flashback) await this.update({ "system.recuerdo.usado": true });
    if (data.defectoGrave || data.achaqueMayor) await this.gainProezas(1);
    if (data.defectoLeve || data.achaqueMenor) await this.update({ "system.defectos.leveUsado": true });

    const result = await rollYayo({
      actor: this,
      label: labelForSkill(skillKey),
      dice,
      atributo: attr,
      bonus,
      dificultad: number(data.dificultad, IMSERSO.srd.defaultDifficulty),
      flavor: `${rollFlavorForSkill(skillKey, attrKey)} · ${baseDice}D base`,
      tipo: "habilidad",
      proezaSpent: usesProezaDado,
      allowYayoReroll: !(data.defectoGrave || data.defectoLeve || data.achaqueMayor || data.achaqueMenor)
    });

    if (result.critico && this.type === "personaje") {
      const points = hasTalent(this, "Carpe diem") ? 2 : 1;
      await this.gainProezas(points, false);
    }
    return result;
  }

  async rollResistenciaFisica(options = {}) {
    const defaults = { dificultad: this.system.resistenciaFisica?.efectivo ?? this.system.resistenciaFisica?.valor ?? calcResistenciaFisica(this.system), extraDados: 0, recuerdo: false };
    const data = options.skipDialog ? defaults : await simpleDialog({
      title: `Resistencia fisica: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <p>Hay que igualar o superar el valor de Resistencia fisica. Si falla, el personaje cae inconsciente.</p>
          <label>Valor de Resistencia fisica ${stepper("dificultad", defaults.dificultad, { min: 1, max: 30 })}</label>
          <label>Dados extra ${stepper("extraDados", 0, { min: -3, max: 3 })}</label>
          <label class="check"><input type="checkbox" name="recuerdo" ${this.system.recuerdo?.usado ? "disabled" : ""}> Recuerdo cuando... (+2D)</label>
          <p class="notes">SRD: 3D sin atributo. Proeza puede repetir dados; Recuerdo cuando... puede añadir +2D.</p>
        </form>`
    });
    if (!data) return;
    let dice = 3 + number(data.extraDados, 0) + (data.recuerdo ? 2 : 0) - number(this.system.penalizadorDados, 0);
    dice = Math.min(IMSERSO.srd.maxDicePool, Math.max(0, dice));
    const updates = {};
    if (!options.reason) updates["system.resistenciaFisica.primeraTirada"] = true;
    if (data.recuerdo) updates["system.recuerdo.usado"] = true;
    if (Object.keys(updates).length) await this.update(updates);
    const result = await rollYayo({
      actor: this,
      label: "Resistencia fisica",
      dice,
      atributo: 0,
      bonus: 0,
      dificultad: number(data.dificultad, defaults.dificultad),
      flavor: options.reason ? `3D6 modificado por Salud · ${options.reason}` : "3D6 modificado por Salud",
      tipo: "resistenciaFisica"
    });
    if (!result.exito) await this.update({ "system.estado.inconsciente": true });
    return result;
  }

  async rollJamacuco(options = {}) {
    return this.rollResistenciaFisica(options);
  }

  async rollResistenciaMental(options = {}) {
    const defaults = { dificultad: this.system.resistenciaMental?.efectivo ?? this.system.resistenciaMental?.valor ?? calcResistenciaMental(this.system), extraDados: 0, recuerdo: false };
    const data = options.skipDialog ? defaults : await simpleDialog({
      title: `Resistencia mental: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <p>Hay que igualar o superar el valor de Resistencia mental. Si falla, el PJ sufre una crisis temporal.</p>
          <label>Valor de Resistencia mental ${stepper("dificultad", defaults.dificultad, { min: 1, max: 30 })}</label>
          <label>Dados extra ${stepper("extraDados", 0, { min: -3, max: 3 })}</label>
          <label class="check"><input type="checkbox" name="recuerdo" ${this.system.recuerdo?.usado ? "disabled" : ""}> Recuerdo cuando... (+2D)</label>
          <p class="notes">SRD: 3D sin atributo. Sin critico ni pifia; Proeza puede repetir dados.</p>
        </form>`
    });
    if (!data) return;
    let dice = 3 + number(data.extraDados, 0) + (data.recuerdo ? 2 : 0);
    dice = Math.min(IMSERSO.srd.maxDicePool, Math.max(0, dice));
    const updates = {};
    if (!options.reason) updates["system.resistenciaMental.primeraTirada"] = true;
    if (data.recuerdo) updates["system.recuerdo.usado"] = true;
    if (Object.keys(updates).length) await this.update(updates);
    const result = await rollYayo({
      actor: this,
      label: "Resistencia mental",
      dice,
      atributo: 0,
      bonus: 0,
      dificultad: number(data.dificultad, defaults.dificultad),
      flavor: options.reason ? `3D6 · ${options.reason}` : "3D6",
      tipo: "resistenciaMental"
    });
    if (!result.exito) await this.update({ "system.estado.crisisMental": true });
    return result;
  }

  async applyStabilityDamage(amount) {
    if (this.type !== "personaje") return;
    const current = number(this.system.estabilidad?.valor, 0);
    const next = Math.max(0, current - number(amount, 0));
    const crossed = estabilidadUmbralesForRuleset(currentRuleset()).filter((t) => current >= t && next < t && !this.system.resistenciaMental?.umbrales?.[t]);
    const updates = { "system.estabilidad.valor": next };
    for (const t of crossed) updates[`system.resistenciaMental.umbrales.${t}`] = true;
    if (next <= 0) updates["system.estado.crisisMental"] = true;
    await this.update(updates);
    if (!crossed.length) return;
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flags: {
        [IMSERSO.ID]: {
          resistenciaMentalWorkflow: {
            actorUuid: this.uuid,
            actorName: this.name,
            thresholds: crossed,
            rolled: []
          }
        }
      },
      content: `
        <div class="ims-chat-card ims-jamacuco-card">
          <header><h3>Umbrales de Resistencia mental</h3><strong>${this.name}</strong></header>
          <p>Cruza por primera vez: <strong>${crossed.join(", ")}</strong>. Hay que resolver una tirada de Resistencia mental por cada umbral.</p>
          <div class="ims-chat-actions">
            ${crossed.map((threshold) => `<button type="button" class="ims-chat-action" data-ims-action="roll-resistencia-mental-threshold" data-threshold="${threshold}">Tirar umbral ${threshold}</button>`).join("")}
          </div>
        </div>`
    });
  }

  async rollInitiativeYayo(options = {}) {
    if (this.system.combate?.sorprendido) {
      const content = `
        <div class="ims-chat-card">
          <header><h3>Iniciativa</h3><strong>Pillado por sorpresa</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> pierde la iniciativa y no puede actuar en este primer turno. Su Agilidad cuenta a la mitad hasta que deje de estar sorprendido.</p>
        </div>`;
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content });
      const combatant = game.combat?.combatants?.find((c) => c.actor?.id === this.id);
      if (combatant) await game.combat.setInitiative(combatant.id, -999);
      return null;
    }
    const weapon = equippedWeapon(this);
    const attackTypeCfg = attackConfig(options.tipo ?? weapon?.system?.tipo ?? "desarmado");
    const des = number(this.system.efectivos?.atributos?.des, this.system.atributos?.des);
    const int = number(this.system.efectivos?.atributos?.int, this.system.atributos?.int);
    const roll = await new Roll(`1d6 + ${des} + ${int}`).evaluate({ async: true });
    const die = roll.dice[0]?.results[0]?.result ?? 0;
    const content = await renderTemplate(`systems/${IMSERSO.ID}/templates/chat/initiative-card.hbs`, {
      actor: this,
      roll,
      die,
      extraAction: die === 6,
      type: weapon?.name ?? attackTypeCfg.label,
      total: roll.total
    });
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), rolls: [roll], content });
    const combatant = game.combat?.combatants?.find((c) => c.actor?.id === this.id);
    if (combatant) await game.combat.setInitiative(combatant.id, roll.total);
    return roll;
  }

  async rollAttack(attackOptions = {}) {
    const targetToken = firstTargetToken(this);
    const target = targetToken?.actor ?? null;
    if (!target) {
      ui.notifications.info("El ataque funciona mejor con un token seleccionado o tarjeteado para automatizar impacto, defensa y daño; se resolverá en modo manual.");
    }
    const item = attackOptions.item ?? equippedWeapon(this) ?? null;
    const currentType = item?.system?.tipo ?? "desarmado";
    const resolvedType = IMSERSO.ataqueTipos[currentType] ? currentType : resolveAttackType(currentType);
    const typeOptions = Object.entries(IMSERSO.ataqueTipos).map(([key, value]) => `<option value="${key}" ${key === resolvedType ? "selected" : ""}>${value.label}</option>`).join("");
    const targetName = target?.name ?? "Objetivo manual";
    const targetAgilidad = target ? actorAgilidad(target) : 9;
    const data = await simpleDialog({
      title: item ? `Ataque: ${item.name}` : `Ataque: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <p>${target ? "Objetivo tarjeteado" : "Objetivo manual"}: <strong>${escapeHtml(targetName)}</strong>.</p>
          ${item ? `<p>Objeto usado: <strong>${escapeHtml(item.name)}</strong>.</p>` : ""}
          ${target ? "" : `<label>Nombre del objetivo<input name="targetName" value="${escapeHtml(targetName)}"></label>`}
          <label>Tipo de ataque<select name="tipo">${typeOptions}</select></label>
          <label>Agilidad objetivo${stepper("dificultad", targetAgilidad, { min: 1, max: 30 })}</label>
          ${target ? "" : `<label>Armadura/protección objetivo${stepper("armadura", 0, { min: 0, max: 30 })}</label>`}
          <label>Dados sacrificados para apuntar${stepper("dadosSacrificados", 0, { min: 0, max: 2 })}</label>
          <label>Dados extra/al alimón${stepper("extraDados", 0, { min: -3, max: 3 })}</label>
          <label class="check"><input type="checkbox" name="proezaDado"> Gastar 1 proeza para +1D a impactar</label>
          <label>Proezas a daño${stepper("proezasDano", 0, { min: 0, max: 3 })}</label>
          <label class="check"><input type="checkbox" name="profesion"> Antigua profesión relacionada (+3)</label>
        </form>`
    });
    if (!data) return;
    const baseAttack = attackConfig(data.tipo);
    const maxDamageProezas = number(baseAttack.maxProezasDano, 2);
    const yays = this.type === "personaje" ? Math.min(maxDamageProezas, Math.max(0, number(data.proezasDano ?? data.yayoDano, 0))) : 0;
    const declaredYayos = yays + (this.type === "personaje" && (data.proezaDado || data.yayoDado) ? 1 : 0);
    if (declaredYayos && !this.canSpendProezas(declaredYayos)) return null;
    const itemSkill = IMSERSO.habilidades[item?.system?.habilidad] ? item.system.habilidad : null;
    const itemDamageAttr = IMSERSO.atributos[item?.system?.atributoDano] ? item.system.atributoDano : null;
    const baseDamageDefault = data.tipo === "desarmado" && this.system.efectivos?.mods?.sinArmasDano != null
      ? this.system.efectivos.mods.sinArmasDano
      : baseAttack.dano;
    const attack = {
      ...baseAttack,
      label: item?.name ?? baseAttack.label,
      tipo: data.tipo ?? baseAttack.tipo,
      habilidad: itemSkill ?? baseAttack.habilidad,
      dano: number(item?.system?.danoBase, baseDamageDefault),
      atributo: itemDamageAttr ?? baseAttack.atributo,
    };
    const result = await this.rollSkill(attack.habilidad, {
      skipDialog: true,
      dificultad: number(data.dificultad, targetAgilidad),
      dadosSacrificados: number(data.dadosSacrificados, 0),
      extraDados: number(data.extraDados, 0),
      proezaDado: !!(data.proezaDado || data.yayoDado),
      profesion: !!data.profesion
    });
    const attackContext = {
      attackerUuid: this.uuid,
      targetUuid: target?.uuid ?? "",
      targetTokenUuid: targetToken?.document?.uuid ?? "",
      targetName: target?.name ?? data.targetName ?? targetName,
      attack,
      attackData: {
        dadosSacrificados: number(data.dadosSacrificados, 0),
        proezasDano: yays,
        yayoDano: yays
      },
      difficulty: number(data.dificultad, targetAgilidad)
    };
    if (result?.message) {
      const rollData = foundry.utils.deepClone(result.message.getFlag(IMSERSO.ID, "rollData") ?? {});
      rollData.attackContext = attackContext;
      await result.message.setFlag(IMSERSO.ID, "rollData", rollData);
    }
    if (!result?.exito) return result;
    if (yays && !(await this.spendProezas(yays))) return result;

    const rawAttrDamage = number(this.system.efectivos?.atributos?.[attack.atributo], this.system.atributos?.[attack.atributo]);
    const attrDamage = attackAttributeDamage(baseAttack, rawAttrDamage);
    const aimedDice = number(data.dadosSacrificados, 0) * (attack.apuntar === "2d6" ? 2 : 1);
    const proezaDamage = await rollExplodingD6(yays);
    const aimedRoll = aimedDice > 0 ? await new Roll(`${aimedDice}d6`).evaluate({ async: true }) : null;
    const armorReduction = result.critico ? 0 : target
      ? number(target.system.efectivos?.mods?.proteccionDano, target.system.proteccion?.dano)
      : number(data.armadura, 0);
    const extraDamage = proezaDamage.total + (aimedRoll?.total ?? 0);
    const subtotal = Math.max(0, attack.dano + attrDamage + extraDamage - armorReduction);
    const totalDamage = result.critico ? subtotal * 2 : subtotal;
    const defenseDifficulty = number(data.dificultad, targetAgilidad);
    const workflow = {
      attackerUuid: this.uuid,
      targetUuid: target?.uuid ?? "",
      targetTokenUuid: targetToken?.document?.uuid ?? "",
      attackerName: this.name,
      targetName: target?.name ?? data.targetName ?? targetName,
      attackLabel: attack.label,
      attackSkill: attack.habilidad,
      attackTipo: data.tipo,
      damage: totalDamage,
      originalDamage: totalDamage,
      formulaText: `${attack.dano} + ${attack.atributo.toUpperCase()} ${attrDamage}${proezaDamage.total ? ` + proezas ${proezaDamage.total}` : ""}${aimedRoll ? ` + apuntar ${aimedRoll.total}` : ""}${armorReduction ? ` - armadura ${armorReduction}` : ""}${result.critico ? " x2 crítico e ignora armadura" : ""}`,
      defenseDifficulty,
      applied: false,
      defended: false,
      defenseText: ""
    };
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [...proezaDamage.rolls, ...(aimedRoll ? [aimedRoll] : [])],
      flags: { [IMSERSO.ID]: { attackWorkflow: workflow } },
      content: damageCard(workflow)
    });
    return result;
  }

  async rollPower(item) {
    if (!item) return null;
    const skillKey = IMSERSO.habilidades[item.system?.habilidad] ? item.system.habilidad : "cultura";
    const difficulty = number(item.system?.dificultad, IMSERSO.srd.mediaDifficulty);
    const result = await this.rollSkill(skillKey, { dificultad: difficulty, skipDialog: false });
    if (!result) return null;
    const details = [
      item.system?.tipo ? `<li><strong>Tipo:</strong> ${escapeHtml(item.system.tipo)}</li>` : "",
      item.system?.preparacion ? `<li><strong>Preparacion:</strong> ${escapeHtml(item.system.preparacion)}</li>` : "",
      item.system?.lanzamiento ? `<li><strong>Lanzamiento:</strong> ${escapeHtml(item.system.lanzamiento)}</li>` : "",
      item.system?.duracion ? `<li><strong>Duracion:</strong> ${escapeHtml(item.system.duracion)}</li>` : "",
      item.system?.caducidad ? `<li><strong>Caducidad:</strong> ${escapeHtml(item.system.caducidad)}</li>` : ""
    ].filter(Boolean).join("");
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card ims-item-card">
          <header><img src="${item.img}" alt=""><h3>${escapeHtml(item.name)}</h3></header>
          <p><strong>${escapeHtml(this.name)}</strong> activa un poder usando ${escapeHtml(labelForSkill(skillKey))} contra dificultad ${difficulty}.</p>
          ${details ? `<ul>${details}</ul>` : ""}
          ${item.system?.descripcion ? `<p>${escapeHtml(item.system.descripcion)}</p>` : ""}
        </div>`
    });
  }

  async boostDefenseYayo() {
    const data = await simpleDialog({
      title: `Proezas defensivas: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <label>Valor a reforzar
            <select name="valor"><option value="agilidad">Agilidad</option><option value="aplomo">Aplomo</option><option value="perspicacia">Perspicacia</option></select>
          </label>
          <label>Proezas a gastar${stepper("puntos", 1, { min: 1, max: 10 })}</label>
        </form>`,
      yes: "Anunciar"
    });
    if (!data) return;
    const points = Math.max(1, number(data.puntos, 1));
    if (!this.canSpendProezas(points)) return null;
    await this.spendProezas(points);
    const boost = points * 3;
    const base = number(this.system[data.valor], this.system[data.valor]?.valor);
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Proezas defensivas</h3><strong>+${boost}</strong></header>
          <p>${this.name} gasta ${points} proeza(s): ${data.valor} pasa de ${base} a ${base + boost} durante un turno.</p>
        </div>`
    });
  }

  async applyDamage(amount) {
    const current = number(this.system.salud?.valor, 0);
    const next = Math.max(0, current - number(amount, 0));
    const crossed = this.type === "personaje"
      ? saludUmbralesForRuleset(currentRuleset()).filter((t) => current >= t && next < t && !this.system.resistenciaFisica?.umbrales?.[t])
      : [];
    const updates = { "system.salud.valor": next };
    for (const t of crossed) updates[`system.resistenciaFisica.umbrales.${t}`] = true;
    if (next <= 0) updates["system.estado.muerto"] = true;
    if (next === 1) updates["system.estado.inconsciente"] = true;
    await this.update(updates);
    if (crossed.length) {
      ui.notifications.warn(`${this.name} cruza umbral(es) de Resistencia fisica: ${crossed.join(", ")}.`);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flags: {
          [IMSERSO.ID]: {
            resistenciaFisicaWorkflow: {
              actorUuid: this.uuid,
              actorName: this.name,
              thresholds: crossed,
              rolled: []
            }
          }
        },
        content: `
          <div class="ims-chat-card ims-jamacuco-card">
            <header><h3>Umbrales de Resistencia fisica</h3><strong>${this.name}</strong></header>
            <p>Cruza por primera vez: <strong>${crossed.join(", ")}</strong>. Hay que resolver una tirada de Resistencia fisica por cada umbral.</p>
            <div class="ims-chat-actions">
              ${crossed.map((threshold) => `<button type="button" class="ims-chat-action" data-ims-action="roll-jamacuco-threshold" data-threshold="${threshold}">Tirar umbral ${threshold}</button>`).join("")}
            </div>
          </div>`
      });
    }
  }

  async heal(amount) {
    const current = number(this.system.salud?.valor, 0);
    const max = number(this.system.salud?.max, current);
    return this.update({ "system.salud.valor": Math.min(max, current + number(amount, 0)) });
  }

  async healStability(amount) {
    if (this.type !== "personaje") return null;
    const current = number(this.system.estabilidad?.valor, 0);
    const max = number(this.system.estabilidad?.max, current);
    const next = Math.min(max, current + number(amount, 0));
    const updates = { "system.estabilidad.valor": next };
    if (next > 0) updates["system.estado.crisisMental"] = false;
    return this.update(updates);
  }

  async useHealingItem(item) {
    const targetToken = firstTargetToken();
    const target = targetToken?.actor ?? this;
    if (!targetToken) ui.notifications.info("La curación funciona mejor con un token seleccionado o tarjeteado; sin objetivo se aplicará al actor que usa el objeto.");
    const result = await this.rollSkill("auxilio", { dificultad: 10 });
    if (!result) return null;
    const amount = result.critico ? 4 : result.exito ? 2 : 0;
    const workflow = {
      healerUuid: this.uuid,
      targetUuid: target.uuid,
      targetTokenUuid: targetToken?.document?.uuid ?? "",
      healerName: this.name,
      targetName: target.name,
      itemName: item.name,
      amount,
      applied: false,
      failed: !result.exito
    };
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flags: { [IMSERSO.ID]: { healingWorkflow: workflow } },
      content: this._renderHealingCard(workflow)
    });
    return result;
  }

  async rollRulesHealing() {
    const targetToken = firstTargetToken();
    const target = targetToken?.actor ?? this;
    if (!targetToken) ui.notifications.info("La curación reglada funciona mejor con un token seleccionado o tarjeteado; sin objetivo se preparará sobre el actor actual.");
    const sources = {
      hospital: { label: "Hospital / centro medico", amount: 2, skill: "" },
      reposo: { label: "Reposo confortable", amount: 1, skill: "" },
      auxilio: { label: "Auxilio DF 10", amount: 2, critAmount: 4, fumbleDamage: 2, skill: "auxilio", difficulty: 10 },
      dormir: { label: "Dormir mas de 8 horas", amount: 1, skill: "" },
      contacto: { label: "Contacto fisico prolongado", amount: 1, skill: "" },
      actividad: { label: "Actividad relajante", amount: 1, skill: "" }
    };
    const options = Object.entries(sources).map(([key, source]) => `<option value="${key}">${source.label}</option>`).join("");
    const data = await simpleDialog({
      title: `Curacion reglada: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <p>Objetivo: <strong>${escapeHtml(target.name)}</strong>.</p>
          <label>Fuente de curacion<select name="source">${options}</select></label>
          <label>Dificultad si requiere tirada${stepper("difficulty", 10, { min: 1, max: 30 })}</label>
        </form>`,
      yes: "Preparar"
    });
    if (!data) return null;
    const source = sources[data.source] ?? sources.casa;
    let amount = source.amount;
    let failed = false;
    if (source.skill) {
      const result = await this.rollSkill(source.skill, { dificultad: number(data.difficulty, source.difficulty), skipDialog: false });
      if (!result) return null;
      failed = !result.exito;
      if (result.pifia && source.fumbleDamage) {
        await target.applyDamage(source.fumbleDamage);
        failed = true;
      }
      amount = result.critico ? (source.critAmount ?? source.amount) : source.amount;
    }
    const workflow = {
      healerUuid: this.uuid,
      targetUuid: target.uuid,
      targetTokenUuid: targetToken?.document?.uuid ?? "",
      healerName: this.name,
      targetName: target.name,
      itemName: source.label,
      amount: failed ? 0 : amount,
      applied: false,
      failed
    };
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flags: { [IMSERSO.ID]: { healingWorkflow: workflow } },
      content: this._renderHealingCard(workflow)
    });
  }

  async rollHazardDamage() {
    const sources = {
      asfixia: "Asfixia",
      electrochoque: "Electrochoque",
      caida: "Caida",
      congelacion: "Congelacion",
      deslomarse: "Deslomarse",
      veneno: "Veneno",
      hambre: "Hambre",
      sed: "Sed",
      cogorza: "Cogorza",
      quemadura: "Quemadura"
    };
    const options = Object.entries(sources).map(([key, label]) => `<option value="${key}">${label}</option>`).join("");
    const data = await simpleDialog({
      title: `Otras cosas que hacen daño: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <label>Fuente de daño<select name="source">${options}</select></label>
          <label>Metros de caída${stepper("metros", 1, { min: 0, max: 50 })}</label>
          <label>Daño / gravedad / horas${stepper("amount", 1, { min: 0, max: 30 })}</label>
          <label>Potencia o dificultad${stepper("difficulty", 10, { min: 1, max: 30 })}</label>
          <label>Daño menor${stepper("minorDamage", 0, { min: 0, max: 30 })}</label>
          <label>Daño mayor${stepper("majorDamage", 3, { min: 0, max: 30 })}</label>
        </form>`,
      yes: "Resolver"
    });
    if (!data) return null;

    const source = data.source;
    let damage = 0;
    let summary = "";
    let details = "";
    let roll = null;
    if (source === "asfixia") {
      roll = await this.rollSkill("fuerzaBruta", { dificultad: 15 });
      damage = roll?.exito ? 0 : 3;
      summary = "tras agotar FUE + 5 turnos sin respirar, tira Fuerza bruta a dificultad 15.";
      details = roll?.exito ? "Aguanta un turno mas." : "Falla: empieza a perder 3 puntos de Salud por turno.";
    } else if (source === "electrochoque") {
      const per = number(this.system.efectivos?.atributos?.per, this.system.atributos?.per);
      damage = 1 + Math.floor(per / 2);
      roll = await this.rollSkill("fuerzaBruta", { dificultad: 20 });
      summary = "arma de electrochoque: 1 + PER/2 de dano y Fuerza bruta DF 20.";
      details = roll?.exito ? "Resiste la incapacitacion." : "Falla: queda incapacitado 3D minutos y sufre -1D durante una hora.";
    } else if (source === "caida") {
      const metros = Math.max(0, number(data.metros, 1));
      damage = Math.max(0, metros - 2) * 3;
      roll = await this.rollSkill("atletismo", { dificultad: 12 });
      summary = `${metros} metro(s) de caída libre: 3 Salud por metro a partir de los dos metros.`;
      details = roll?.exito ? "Supera Atletismo dificultad 12: reduce el daño total en 3." : "Falla Atletismo dificultad 12: recibe todo el daño de la caída.";
      if (roll?.exito) damage = Math.max(0, damage - 3);
    } else if (source === "congelacion") {
      damage = Math.max(0, number(data.amount, 1));
      summary = "frío intenso: normalmente 1 Salud por cada quince minutos de tiempo de juego.";
    } else if (source === "deslomarse") {
      roll = await this.rollSkill("fuerzaBruta", { dificultad: 15 });
      damage = roll?.exito ? 0 : 2;
      summary = "esfuerzo físico extraordinario: Fuerza bruta dificultad 15.";
      details = roll?.exito ? "Aguanta el esfuerzo." : "El sobreesfuerzo causa 2 puntos de daño.";
    } else if (source === "veneno") {
      const difficulty = Math.max(1, number(data.difficulty, 10));
      roll = await this.rollSkill("fuerzaBruta", { dificultad: difficulty });
      damage = roll?.exito ? number(data.minorDamage, 0) : number(data.majorDamage, 3);
      summary = `veneno POT ${difficulty}: Fuerza bruta contra la potencia.`;
      details = roll?.exito ? "Supera la tirada: sufre el daño menor." : "Falla la tirada: sufre el daño mayor.";
    } else if (source === "hambre") {
      damage = Math.floor(number(data.amount, 24) / 24);
      summary = `${number(data.amount, 24)} hora(s) sin comer: 1 Salud por cada 24 horas.`;
    } else if (source === "sed") {
      damage = Math.floor(number(data.amount, 6) / 6);
      summary = `${number(data.amount, 6)} hora(s) sin beber: 1 Salud por cada 6 horas.`;
    } else if (source === "cogorza") {
      const difficulty = Math.max(10, number(data.difficulty, 10));
      const byDifficulty = difficulty >= 20 ? 3 : difficulty >= 15 ? 2 : 1;
      roll = await this.rollSkill("fuerzaBruta", { dificultad: difficulty });
      damage = roll?.exito ? 0 : byDifficulty;
      summary = `intoxicacion etilica: Fuerza bruta dificultad ${difficulty}.`;
      details = roll?.exito ? "Aguanta la borrachera." : "Pierde Salud y sufre -1D a todas las tiradas durante 6 horas; anotalo en estado si procede.";
    } else if (source === "quemadura") {
      damage = Math.max(0, number(data.amount, 3));
      summary = "fuego abierto suele causar 3 Salud por turno; sol sin crema causa 1 Salud cada par de horas.";
    }

    const workflow = {
      targetUuid: this.uuid,
      targetName: this.name,
      label: sources[source] ?? "Daño reglado",
      summary,
      details,
      damage,
      applied: false
    };
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: roll?.roll ? [roll.roll] : [],
      flags: { [IMSERSO.ID]: { hazardWorkflow: workflow } },
      content: hazardCard(workflow)
    });
  }

  async worsenAttribute() {
    if (this.type !== "personaje") return ui.notifications.warn("El empeoramiento solo se aplica a PJ.");
    const attrs = Object.entries(IMSERSO.atributos)
      .filter(([key]) => number(this.system.atributos?.[key], 0) > 0)
      .map(([key, cfg]) => `<option value="${key}">${cfg.label} (${cfg.short}) ${number(this.system.atributos?.[key], 0)} → ${number(this.system.atributos?.[key], 0) - 1}</option>`)
      .join("");
    if (!attrs) return ui.notifications.warn(`${this.name} no tiene atributos por encima de 0.`);
    const data = await simpleDialog({
      title: `Empeoramiento: ${this.name}`,
      content: `<form class="ims-dialog"><label>Atributo a rebajar<select name="attr">${attrs}</select></label></form>`,
      yes: "Empeorar"
    });
    if (!data?.attr) return null;
    const before = number(this.system.atributos?.[data.attr], 0);
    const after = Math.max(0, before - 1);
    await this.update({ [`system.atributos.${data.attr}`]: after });
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Empeoramiento</h3><strong>${escapeHtml(labelForAttribute(data.attr))}</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> termina la aventura con vida y rebaja ${escapeHtml(labelForAttribute(data.attr))}: ${before} → ${after}.</p>
        </div>`
    });
  }

  async rollPursuit() {
    const targetToken = firstTargetToken(this);
    const target = targetToken?.actor;
    if (!target) {
      ui.notifications.info("La persecución funciona mejor con un token seleccionado o tarjeteado; se resolverá con una referencia manual.");
    }
    const difficulty = target ? actorAgilidad(target) : 9;
    const data = await simpleDialog({
      title: `Persecucion: ${this.name}`,
      content: `
        <form class="ims-dialog">
          <p>Referencia: <strong>${escapeHtml(target?.name ?? "manual")}</strong>, Agilidad ${difficulty}.</p>
          ${target ? "" : `<label>Nombre de referencia<input name="targetName" value="Referencia manual"></label>`}
          <label>Habilidad
            <select name="skill">
              <option value="atletismo">Atletismo</option>
              <option value="conducir">Conducir</option>
            </select>
          </label>
          <label>Dificultad${stepper("difficulty", difficulty, { min: 1, max: 30 })}</label>
        </form>`,
      yes: "Tirar"
    });
    if (!data) return null;
    const result = await this.rollSkill(data.skill, { dificultad: number(data.difficulty, difficulty), skipDialog: false });
    if (!result) return null;
    const title = result.critico ? "Exito critico" : result.pifia ? "Pifia" : result.exito ? "Exito" : "Fallo";
    const outcome = result.critico ? "exito critico: gana una distancia adicional."
      : result.pifia ? "pifia: se produce un percance o accidente."
        : result.exito ? "exito: mejora su posicion en la persecucion."
          : "fallo: pierde posicion en la persecucion.";
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Persecucion</h3><strong>${title}</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> resuelve persecucion contra <strong>${escapeHtml(target?.name ?? data.targetName ?? "referencia manual")}</strong>: ${outcome}</p>
        </div>`
    });
  }

  async reserveAction() {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Defensa completa</h3><strong>+1D Agilidad</strong></header>
          <p><strong>${escapeHtml(this.name)}</strong> se defiende completamente: aumenta su Agilidad durante este turno y asciende una posicion en iniciativa a partir del siguiente.</p>
        </div>`
    });
  }

  _renderHealingCard(data) {
    const status = data.failed ? "Sin efecto" : data.applied ? "Curacion aplicada" : "Curacion pendiente";
    const buttons = data.failed || data.applied ? "" : `
      <div class="ims-chat-actions">
        <button type="button" class="ims-chat-action" data-ims-action="apply-healing">Aplicar curacion</button>
      </div>`;
    return `
      <div class="ims-chat-card ims-healing-card">
        <header><h3>${escapeHtml(data.itemName)}</h3><strong>${status}</strong></header>
        <p><strong>${escapeHtml(data.healerName)}</strong> prepara curacion sobre <strong>${escapeHtml(data.targetName)}</strong>.</p>
        ${data.failed ? "<p>La tirada requerida falla: no se recupera Salud.</p>" : `<p>Recuperacion calculada: <strong>${data.amount}</strong> de Salud.</p>`}
        ${buttons}
      </div>`;
  }

  canSpendProezas(amount = 1) {
    if (this.type !== "personaje") return true;
    const current = number(this.system.proezas?.valor, 0);
    if (current >= amount) return true;
    ui.notifications.warn(`${this.name} no tiene proezas suficientes (${current}/${amount}).`);
    return false;
  }

  async spendProezas(amount = 1) {
    if (this.type !== "personaje") return;
    const current = number(this.system.proezas?.valor, 0);
    if (current < amount) {
      ui.notifications.warn(`${this.name} no tiene proezas suficientes (${current}/${amount}).`);
      return false;
    }
    const next = Math.max(0, current - amount);
    await this.update({ "system.proezas.valor": next });
    return this._announceProezas("gasta", amount, current, next);
  }

  async gainProezas(amount = 1, notify = true) {
    if (this.type !== "personaje") return;
    const current = number(this.system.proezas?.valor, 0);
    if (notify) ui.notifications.info(`${this.name} gana ${amount} proeza.`);
    const next = current + amount;
    await this.update({ "system.proezas.valor": next });
    return this._announceProezas("gana", amount, current, next);
  }

  canSpendYayopoints(amount = 1) {
    return this.canSpendProezas(amount);
  }

  async spendYayopoints(amount = 1) {
    return this.spendProezas(amount);
  }

  async gainYayopoints(amount = 1, notify = true) {
    return this.gainProezas(amount, notify);
  }

  async spendPuntoGuion(amount = 1) {
    if (this.type !== "personaje") return;
    const current = number(this.system.puntoGuion?.valor, 0);
    if (current < amount) {
      ui.notifications.warn(`${this.name} no tiene puntos de guion suficientes (${current}/${amount}).`);
      return false;
    }
    const next = Math.max(0, current - amount);
    await this.update({
      "system.puntoGuion.valor": next,
      "system.puntoGuion.usado": next <= 0
    });
    return this._announcePuntoGuion("gasta", amount, current, next);
  }

  async gainPuntoGuion(amount = 1) {
    if (this.type !== "personaje") return;
    const current = number(this.system.puntoGuion?.valor, 0);
    const max = Math.max(1, number(this.system.puntoGuion?.max, 1));
    const next = Math.min(max, current + amount);
    if (next === current) {
      ui.notifications.info(`${this.name} ya tiene el punto de guion al maximo (${current}/${max}).`);
      return false;
    }
    await this.update({
      "system.puntoGuion.valor": next,
      "system.puntoGuion.usado": next <= 0
    });
    return this._announcePuntoGuion("recupera", next - current, current, next);
  }

  async _announcePuntoGuion(verb, amount, before, after) {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Punto de guion</h3><strong>${after}</strong></header>
          <p><strong>${this.name}</strong> ${verb} ${amount} punto(s) de guion: ${before} → ${after}.</p>
        </div>`
    });
  }

  async _announceProezas(verb, amount, before, after) {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `
        <div class="ims-chat-card">
          <header><h3>Proezas</h3><strong>${after}</strong></header>
          <p><strong>${this.name}</strong> ${verb} ${amount} proeza(s): ${before} → ${after}.</p>
        </div>`
    });
  }

  async _skillDialog(skillKey, defaults) {
    const skill = IMSERSO.habilidades[skillKey];
    const op = skill.oposicion ? `<option value="${skill.oposicion}">Contra ${skill.oposicion}</option>` : "";
    return simpleDialog({
      title: `Tirada: ${labelForSkill(skillKey)}`,
      content: `
        <form class="ims-dialog">
          <div class="ims-dialog-grid">
            <label><span>Dificultad</span>
              ${stepper("dificultad", defaults.dificultad, { min: 1, max: 30 })}
            </label>
            <label><span>Dados extra / al alimón</span>
              ${stepper("extraDados", 0, { min: -3, max: 3 })}
            </label>
            <label><span>Modificador fijo</span>
              ${stepper("bonus", 0, { min: -20, max: 20 })}
            </label>
            <label><span>Dados sacrificados</span>
              ${stepper("dadosSacrificados", 0, { min: 0, max: 2 })}
            </label>
          </div>
          ${defaults.oppositionText ? `<p class="notes">Oposicion detectada: ${escapeHtml(defaults.oppositionText)}.</p>` : ""}
          <div class="ims-dialog-checks">
            <label class="check"><input type="checkbox" name="profesion"> Profesion/perfil (+3)</label>
            <label class="check"><input type="checkbox" name="proezaDado"> Proeza antes de tirar (+1D)</label>
            <label class="check"><input type="checkbox" name="recuerdo" ${this.system.recuerdo?.usado ? "disabled" : ""}> Recuerdo cuando... (+2D)</label>
            <label class="check"><input type="checkbox" name="defectoGrave"> Defecto grave (-1D, +1 proeza)</label>
            <label class="check"><input type="checkbox" name="defectoLeve" ${this.system.defectos?.leveUsado ? "disabled" : ""}> Defecto leve (repeticion normal)</label>
          </div>
          <select name="oposicion" hidden><option value="">Dificultad fija</option>${op}</select>
        </form>`
    });
  }
}
