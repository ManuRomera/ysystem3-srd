import { IMSERSO, labelForAttribute, labelForSkill } from "./config.mjs";

const SKILL_ROLL_TYPES = new Set(["habilidad", ""]);
const REROLLABLE_ROLL_TYPES = new Set(["habilidad", "", "resistenciaFisica", "resistenciaMental"]);

export function clampDicePool(value) {
  return Math.max(0, Math.min(IMSERSO.srd.maxDicePool, Number(value) || 0));
}

export function countFaces(roll, face) {
  return roll.dice.flatMap((die) => die.results).filter((result) => result.result === face && result.active !== false).length;
}

export function allDiceAre(roll, face) {
  const results = roll.dice.flatMap((die) => die.results).filter((result) => result.active !== false);
  return results.length > 0 && results.every((result) => result.result === face);
}

export async function rollYayo({
  actor,
  label,
  dice,
  atributo = 0,
  bonus = 0,
  dificultad = IMSERSO.srd.defaultDifficulty,
  flavor = "",
  tipo = "habilidad",
  yayoReroll = false,
  allowYayoReroll = true
}) {
  const safeDice = clampDicePool(dice);
  const formula = safeDice > 0
    ? `${safeDice}d6 + ${Number(atributo) || 0} + ${Number(bonus) || 0}`
    : `${Number(atributo) || 0} + ${Number(bonus) || 0}`;
  const roll = await new Roll(formula).evaluate({ async: true });
  const isSkillRoll = SKILL_ROLL_TYPES.has(tipo) && safeDice > 0;
  const isRerollableRoll = REROLLABLE_ROLL_TYPES.has(tipo) && safeDice > 0;
  const sixes = isSkillRoll ? countFaces(roll, 6) : 0;
  const pifia = isSkillRoll && allDiceAre(roll, 1);
  const critico = isSkillRoll && sixes >= 2;
  const total = roll.total;
  const exitoBase = total >= dificultad;
  const exito = critico || (!pifia && exitoBase);
  const canReroll = isRerollableRoll
    && allowYayoReroll
    && actor?.type === "personaje"
    && !exito
    && !yayoReroll
    && tipo !== "iniciativa"
    && tipo !== "miedo";
  const result = { actor, label, roll, dice: safeDice, atributo, bonus, dificultad, flavor, tipo, total, sixes, critico, pifia, exito, canReroll, yayoReroll };
  result.message = await sendRollToChat(result);
  return result;
}

export async function sendRollToChat(result) {
  const cls = result.critico ? "critico" : result.pifia ? "pifia" : result.exito ? "exito" : "fallo";
  const title = result.critico ? "Éxito crítico" : result.pifia ? "Pifia" : result.exito ? "Éxito" : "Fallo";
  const content = await renderTemplate(`systems/${IMSERSO.ID}/templates/chat/roll-card.hbs`, {
    ...result,
    cssClass: cls,
    title,
    diceFaces: result.roll.dice.flatMap((die) => die.results).map((r) => r.result),
    formula: result.roll.formula,
    tooltip: await result.roll.getTooltip()
  });
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: result.actor }),
    rolls: [result.roll],
    flags: {
      [IMSERSO.ID]: {
        rollData: {
          actorUuid: result.actor?.uuid,
          label: result.label,
          dice: result.dice,
          atributo: result.atributo,
          bonus: result.bonus,
          dificultad: result.dificultad,
          flavor: result.flavor,
          tipo: result.tipo,
          diceFaces: result.roll.dice.flatMap((die) => die.results).map((r) => r.result),
          canReroll: result.canReroll,
          rerolled: false
        }
      }
    },
    content
  });
}

export async function simpleDialog({ title, content, data = {}, yes = "Tirar" }) {
  return Dialog.prompt({
    title,
    content,
    label: yes,
    callback: (html) => {
      const form = html[0]?.querySelector("form") ?? html[0];
      const fd = new FormData(form);
      const out = foundry.utils.deepClone(data);
      for (const [key, value] of fd.entries()) {
        if (value === "on") out[key] = true;
        else if (value === "") out[key] = "";
        else if (!Number.isNaN(Number(value)) && value.trim?.() !== "") out[key] = Number(value);
        else out[key] = value;
      }
      for (const input of form.querySelectorAll("input[type='checkbox']")) {
        if (!fd.has(input.name)) out[input.name] = false;
      }
      return out;
    },
    rejectClose: false
  });
}

export function rollFlavorForSkill(skillKey, attrKey) {
  return `${labelForSkill(skillKey)} (${labelForAttribute(attrKey)})`;
}
