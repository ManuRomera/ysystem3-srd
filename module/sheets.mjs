import {
  IMSERSO,
  labelForAttribute,
  labelForSkill,
  attackConfig,
  saludUmbralesForRuleset,
  estabilidadUmbralesForRuleset,
  currentRuleset
} from "./config.mjs";
import { helpEntry } from "./help-data.mjs";

const ActorSheet = foundry.appv1?.sheets?.ActorSheet ?? globalThis.ActorSheet;
const ItemSheet = foundry.appv1?.sheets?.ItemSheet ?? globalThis.ItemSheet;

function entries(obj) {
  return Object.entries(obj ?? {});
}

function buildPointTrack({
  length,
  current,
  max,
  thresholds,
  thresholdLabels,
  crossedUmbrales,
  zoneForValue
}) {
  return Array.from({ length }, (_, i) => {
    const value = i + 1;
    return {
      value,
      zone: zoneForValue(value),
      active: value <= current,
      maxed: value <= max,
      threshold: thresholds.includes(value),
      thresholdLabel: thresholdLabels[value] ?? "",
      crossed: !!crossedUmbrales?.[value]
    };
  });
}

export class ImsersoActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["imserso", "sheet", "actor"],
      width: 780,
      height: 640,
      resizable: true,
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false,
      tabs: [{ navSelector: ".ims-tabs", contentSelector: ".ims-body", initial: "ficha" }],
      dragDrop: [{ dragSelector: ".item", dropSelector: ".ims-sheet" }]
    });
  }

  get template() {
    const layout = game.settings?.get?.(IMSERSO.ID, "sheetLayout") ?? "screen";
    const suffix = layout === "a4" ? "-a4" : "";
    return `systems/${IMSERSO.ID}/templates/actor/${this.actor.type}-sheet${suffix}.hbs`;
  }

  async getData() {
    const context = await super.getData();
    const system = this.actor.system;
    context.system = system;
    context.config = IMSERSO;
    context.isGM = game.user.isGM;
    context.sheetLayout = game.settings?.get?.(IMSERSO.ID, "sheetLayout") ?? "screen";
    context.skillEditEnabled = !!this._summarySkillEdit;
    context.logoPath = `systems/${IMSERSO.ID}/assets/ysystem-icon.png`;
    context.atributos = entries(IMSERSO.atributos).map(([key, cfg]) => ({
      key,
      ...cfg,
      value: system.atributos?.[key] ?? 0
    }));
    context.attrOptions = [0, 1, 2, 4, 6].map((value) => ({ value, label: value >= 0 ? `+${value}` : `${value}` }));
    context.habilidades = entries(IMSERSO.habilidades).map(([key, cfg]) => ({
      key,
      ...cfg,
      attrLabel: labelForAttribute(cfg.atributo),
      dados: system.habilidades?.[key]?.dados ?? 1,
      dots: [1, 2, 3].map((n) => ({ value: n, active: (system.habilidades?.[key]?.dados ?? 1) >= n }))
    }));
    const ruleset = currentRuleset();
    const saludUmbrales = saludUmbralesForRuleset(ruleset);
    const estabilidadUmbrales = estabilidadUmbralesForRuleset(ruleset);
    const saludValor = Number(system.salud?.valor) || 0;
    const saludMax = Number(system.salud?.max) || 0;
    const estabilidadValor = Number(system.estabilidad?.valor) || 0;
    const estabilidadMax = Number(system.estabilidad?.max) || 0;

    const maxHealthTrack = Math.max(28, saludMax);
    context.healthGridStyle = `grid-template-columns: repeat(${maxHealthTrack}, minmax(24px, 1fr));`;
    context.healthZones = [
      { label: "UCI", class: "zone-uci", style: "grid-column: 1 / 2;" },
      { label: "-3D", class: "zone-minus3", style: "grid-column: 2 / 5;" },
      { label: "-2D", class: "zone-minus2", style: "grid-column: 5 / 8;" },
      { label: "-1D", class: "zone-minus1", style: "grid-column: 8 / 12;" },
      { label: "Sin penalizador", class: "zone-safe", style: `grid-column: 12 / ${maxHealthTrack + 1};` }
    ].filter((zone) => {
      const end = Number(zone.style.match(/\/ (\d+)/)?.[1] ?? maxHealthTrack + 1);
      const start = Number(zone.style.match(/: (\d+)/)?.[1] ?? 0);
      return end > start;
    });
    const healthThresholdLabels = { 16: "RF", 11: "-1D", 7: "-2D", 4: "-3D", 2: "RF" };
    context.healthTrack = buildPointTrack({
      length: maxHealthTrack,
      current: saludValor,
      max: saludMax,
      thresholds: saludUmbrales,
      thresholdLabels: healthThresholdLabels,
      crossedUmbrales: system.resistenciaFisica?.umbrales,
      zoneForValue: (value) => (value <= 4 ? "danger" : value <= 11 ? "warning" : "safe")
    });

    if (this.actor.type === "personaje") {
      const maxStabilityTrack = Math.max(28, estabilidadMax);
      context.stabilityGridStyle = `grid-template-columns: repeat(${maxStabilityTrack}, minmax(24px, 1fr));`;
      context.stabilityZones = [
        { label: "Locura", class: "zone-mind-0", style: "grid-column: 1 / 2;" },
        { label: "Crisis", class: "zone-mind-danger", style: "grid-column: 2 / 5;" },
        { label: "Tension", class: "zone-mind-warning", style: "grid-column: 5 / 12;" },
        { label: "Alerta RM", class: "zone-mind-alert", style: "grid-column: 12 / 17;" },
        { label: "Estable", class: "zone-mind-safe", style: `grid-column: 17 / ${maxStabilityTrack + 1};` }
      ].filter((zone) => {
        const end = Number(zone.style.match(/\/ (\d+)/)?.[1] ?? maxStabilityTrack + 1);
        const start = Number(zone.style.match(/: (\d+)/)?.[1] ?? 0);
        return end > start;
      });
      const stabilityThresholdLabels = Object.fromEntries(estabilidadUmbrales.map((t) => [t, "RM"]));
      context.stabilityTrack = buildPointTrack({
        length: maxStabilityTrack,
        current: estabilidadValor,
        max: estabilidadMax,
        thresholds: estabilidadUmbrales,
        thresholdLabels: stabilityThresholdLabels,
        crossedUmbrales: system.resistenciaMental?.umbrales,
        zoneForValue: (value) => (value <= 4 ? "danger" : value <= 11 ? "warning" : "safe")
      });
      context.estabilidadCritica = estabilidadValor <= 0;
    }
    context.penaltyLabel = system.penalizadorDados ? `-${system.penalizadorDados}D` : "Sin penalizador";
    context.itemsByType = {
      arma: this.actor.items.filter((i) => i.type === "arma"),
      armadura: this.actor.items.filter((i) => i.type === "armadura"),
      escudo: this.actor.items.filter((i) => i.type === "escudo"),
      objeto: this.actor.items.filter((i) => i.type === "objeto" || i.type === "equipo"),
      poder: this.actor.items.filter((i) => i.type === "poder"),
      talento: this.actor.items.filter((i) => i.type === "talento"),
      arquetipo: this.actor.items.filter((i) => i.type === "arquetipo")
    };
    context.itemCreateTypes = [
      { type: "arma", label: "Arma", icon: "fa-gavel" },
      { type: "armadura", label: "Armadura", icon: "fa-vest" },
      { type: "escudo", label: "Escudo", icon: "fa-shield-halved" },
      { type: "objeto", label: "Objeto", icon: "fa-suitcase" },
      { type: "poder", label: "Poder", icon: "fa-wand-sparkles" },
      { type: "talento", label: "Talento", icon: "fa-star" },
      { type: "arquetipo", label: "Arquetipo", icon: "fa-id-card" }
    ];
    context.itemsFlat = this.actor.items.contents ?? this.actor.items.map((item) => item);
    context.equipmentNotes = system.efectivos?.mods?.notas ?? [];
    context.attackTypes = entries(IMSERSO.ataqueTipos).map(([key, cfg]) => ({ key, ...cfg }));
    context.skillOptions = entries(IMSERSO.habilidades).map(([key, cfg]) => ({ key, ...cfg, attrLabel: labelForAttribute(cfg.atributo) }));
    context.arquetipos = [];
    const equippedWeapon = this.actor.items.find((item) => item.type === "arma" && item.system?.equipado) ?? null;
    const attackType = equippedWeapon?.system?.tipo ?? system.ataque?.tipo ?? "desarmado";
    const baseAttack = attackConfig(attackType);
    const attackSkill = equippedWeapon?.system?.habilidad ?? system.ataque?.habilidad ?? baseAttack.habilidad;
    const attackAttr = equippedWeapon?.system?.atributoDano ?? baseAttack.atributo;
    context.effectiveAttack = {
      equipped: !!equippedWeapon,
      source: equippedWeapon ? `Arma equipada: ${equippedWeapon.name}` : "Ataque base del PNJ",
      name: equippedWeapon?.name ?? system.ataque?.nombre ?? baseAttack.label,
      type: attackType,
      typeLabel: baseAttack.label,
      skill: attackSkill,
      skillLabel: labelForSkill(attackSkill),
      damage: equippedWeapon?.system?.danoBase ?? system.ataque?.dano ?? baseAttack.dano,
      attr: attackAttr,
      attrLabel: labelForAttribute(attackAttr),
      initiative: equippedWeapon?.system?.iniciativa ?? baseAttack.iniciativa
    };
    return context;
  }

  async _render(force, options) {
    this._captureScrollState();
    await super._render(force, options);
    this._restoreScrollState();
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._restoreScrollState();
    html.find(".ims-tab-panel, .ims-body").on("scroll", () => this._captureScrollState());
    html.on("contextmenu", "[data-help-type], .item[data-item-id]", (ev) => this._showContextHelp(ev, { force: true }));
    html.on("mouseenter", "[data-help-type], .item[data-item-id]", (ev) => this._scheduleContextHelp(ev));
    html.on("mouseleave mousedown wheel", "[data-help-type], .item[data-item-id]", () => this._clearContextHelpTimer());
    if (!this.isEditable) return;

    html.find("[data-roll-skill]").on("click", (ev) => this._withScroll(() => this.actor.rollSkill(ev.currentTarget.dataset.rollSkill)));
    html.find("[data-roll-resistencia-fisica], [data-roll-jamacuco]").on("click", () => this._withScroll(() => this.actor.rollResistenciaFisica()));
    html.find("[data-roll-resistencia-mental]").on("click", () => this._withScroll(() => this.actor.rollResistenciaMental()));
    html.find("[data-roll-initiative]").on("click", () => this._withScroll(() => this.actor.rollInitiativeYayo()));
    html.find("[data-roll-attack]").on("click", () => this._withScroll(() => this.actor.rollAttack()));
    html.find("[data-roll-pursuit]").on("click", () => this._withScroll(() => this.actor.rollPursuit()));
    html.find("[data-roll-reserve]").on("click", () => this._withScroll(() => this.actor.reserveAction()));
    html.find("[data-roll-fear]").on("click", () => this._withScroll(() => game.imserso.rollMiedo?.()));
    html.find("[data-apply-archetype]").on("click", (ev) => this._withScroll(() => this._applySelectedArchetype(ev.currentTarget)));
    html.find("[data-rules-heal]").on("click", () => this._withScroll(() => this.actor.rollRulesHealing()));
    html.find("[data-hazard-damage]").on("click", () => this._withScroll(() => this.actor.rollHazardDamage()));
    html.find("[data-worsen-attribute]").on("click", () => this._withScroll(() => this.actor.worsenAttribute()));
    html.find("[data-pnj-attack-type], [data-extra-attack-type]").on("change", (ev) => this._withScroll(() => this._syncExtraAttackType(ev.currentTarget.value)));
    html.find("[data-boost-defense]").on("click", () => this._withScroll(() => this.actor.boostDefenseYayo()));
    html.find("[data-gain-yayo]").on("click", () => this._withScroll(() => this.actor.gainProezas(1)));
    html.find("[data-spend-yayo]").on("click", () => this._withScroll(() => this.actor.spendProezas(1)));
    html.find("[data-gain-punto-guion]").on("click", () => this._withScroll(() => this.actor.gainPuntoGuion(1)));
    html.find("[data-spend-punto-guion]").on("click", () => this._withScroll(() => this.actor.spendPuntoGuion(1)));
    html.find("[data-heal]").on("click", () => this._withScroll(() => this._askNumber("Curar Salud", "Puntos a recuperar", (n) => this.actor.heal(n))));
    html.find("[data-damage]").on("click", () => this._withScroll(() => this._askNumber("Aplicar daño", "Puntos de Salud perdidos", (n) => this.actor.applyDamage(n))));
    html.find("[data-health]").on("click", (ev) => this._withScroll(() => {
      const next = Number(ev.currentTarget.dataset.health);
      const current = Number(this.actor.system.salud?.valor) || 0;
      if (next < current) return this.actor.applyDamage(current - next);
      return this.actor.heal(next - current);
    }));
    html.find("[data-stability]").on("click", (ev) => this._withScroll(() => {
      const next = Number(ev.currentTarget.dataset.stability);
      const current = Number(this.actor.system.estabilidad?.valor) || 0;
      if (next < current) return this.actor.applyStabilityDamage(current - next);
      return this.actor.healStability(next - current);
    }));
    html.find("[data-stability-damage]").on("click", () => this._withScroll(() => this._askNumber("Perder Estabilidad", "Puntos de Estabilidad perdidos", (n) => this.actor.applyStabilityDamage(n))));
    html.find("[data-stability-heal]").on("click", () => this._withScroll(() => this._askNumber("Recuperar Estabilidad", "Puntos de Estabilidad recuperados", (n) => this.actor.healStability(n))));
    html.find("[data-toggle-skill-edit]").on("click", (ev) => {
      const button = ev.currentTarget;
      const grid = button.closest(".ys-card")?.querySelector("[data-skill-edit]");
      const enabled = grid?.dataset.skillEdit === "true";
      if (grid) grid.dataset.skillEdit = enabled ? "false" : "true";
      this._summarySkillEdit = !enabled;
      button.classList.toggle("active", !enabled);
    });
    html.find("[data-skill-dot]").on("click", (ev) => {
      const editContainer = ev.currentTarget.closest("[data-skill-edit]");
      if (editContainer && editContainer.dataset.skillEdit !== "true") return;
      const el = ev.currentTarget;
      this._withScroll(() => this.actor.update({ [`system.habilidades.${el.dataset.skillDot}.dados`]: Number(el.dataset.value) }));
    });
    html.find("[data-item-create]").on("click", (ev) => this._withScroll(() => this._createItem(ev.currentTarget.dataset.itemCreate)));
    html.find("[data-item-edit]").on("click", (ev) => this.actor.items.get(ev.currentTarget.closest(".item").dataset.itemId)?.sheet.render(true));
    html.find("[data-item-delete]").on("click", (ev) => this.actor.items.get(ev.currentTarget.closest(".item").dataset.itemId)?.delete());
    html.find("[data-item-chat]").on("click", (ev) => this.actor.items.get(ev.currentTarget.closest(".item").dataset.itemId)?.mostrarEnChat());
    html.find("[data-item-use]").on("click", (ev) => this.actor.items.get(ev.currentTarget.closest(".item").dataset.itemId)?.usar());
    html.find("[data-item-equip]").on("click", (ev) => {
      const item = this.actor.items.get(ev.currentTarget.closest(".item").dataset.itemId);
      if (item) this._withScroll(async () => {
        const next = !item.system.equipado;
        if (next && ["arma", "armadura", "escudo"].includes(item.type)) {
          const others = this.actor.items
            .filter((candidate) => candidate.type === item.type && candidate.id !== item.id && candidate.system?.equipado)
            .map((candidate) => ({ _id: candidate.id, "system.equipado": false }));
          if (others.length) await this.actor.updateEmbeddedDocuments("Item", others);
        }
        return item.update({ "system.equipado": next });
      });
    });
  }

  async _askNumber(title, label, fn) {
    const value = await Dialog.prompt({
      title,
      content: `<form class="ims-dialog"><label>${label}<div class="ims-stepper" data-min="0" data-max="99" data-step="1"><button type="button" data-ims-step="-1"><i class="fas fa-minus"></i></button><input type="number" name="amount" value="1" min="0" readonly><button type="button" data-ims-step="1"><i class="fas fa-plus"></i></button></div></label></form>`,
      label: "Aplicar",
      callback: (html) => Number(new FormData(html[0].querySelector("form")).get("amount") ?? 0),
      rejectClose: false
    });
    if (value || value === 0) return fn(value);
  }

  async _createItem(type) {
    const names = {
      arma: "Nueva arma",
      armadura: "Nueva armadura",
      escudo: "Nuevo escudo",
      objeto: "Nuevo objeto",
      poder: "Nuevo poder",
      talento: "Nuevo talento",
      arquetipo: "Nuevo arquetipo",
      equipo: "Nuevo equipo"
    };
    return this.actor.createEmbeddedDocuments("Item", [{ name: names[type] ?? "Nuevo equipo", type }]);
  }

  async _syncExtraAttackType(type) {
    if (this.actor.type !== "pnj") return;
    const attack = attackConfig(type);
    if (!attack) return;
    return this.actor.update({
      "system.ataque.tipo": type,
      "system.ataque.nombre": attack.label,
      "system.ataque.habilidad": attack.habilidad,
      "system.ataque.dano": attack.dano
    });
  }

  async _applySelectedArchetype(button) {
    const root = button?.closest?.(".ims-archetype-panel") ?? this.element?.[0];
    const value = root?.querySelector?.("[data-archetype-select]")?.value ?? this.actor.system.datos?.arquetipo;
    return this.actor.applyArchetype(value);
  }

  _withScroll(fn) {
    this._captureScrollState();
    return fn();
  }

  _captureScrollState() {
    const root = this.element?.[0];
    if (!root) return;
    this._imsScrollState = {};
    for (const el of root.querySelectorAll(".ims-body, .ims-tab-panel")) {
      const key = el.dataset.tab ? `tab:${el.dataset.tab}` : el.className;
      this._imsScrollState[key] = { top: el.scrollTop, left: el.scrollLeft };
    }
  }

  _restoreScrollState() {
    const state = this._imsScrollState;
    if (!state) return;
    window.setTimeout(() => {
      const root = this.element?.[0];
      if (!root) return;
      for (const el of root.querySelectorAll(".ims-body, .ims-tab-panel")) {
        const key = el.dataset.tab ? `tab:${el.dataset.tab}` : el.className;
        const saved = state[key];
        if (!saved) continue;
        el.scrollTop = saved.top;
        el.scrollLeft = saved.left;
      }
    }, 0);
  }

  _scheduleContextHelp(event) {
    this._clearContextHelpTimer();
    const original = event.originalEvent ?? event;
    const target = event.currentTarget;
    this._imsHelpTimer = window.setTimeout(() => {
      this._openContextHelp(target, original.clientX, original.clientY, { hover: true });
    }, 2750);
  }

  _clearContextHelpTimer() {
    if (!this._imsHelpTimer) return;
    window.clearTimeout(this._imsHelpTimer);
    this._imsHelpTimer = null;
  }

  _showContextHelp(event, { force = false } = {}) {
    this._clearContextHelpTimer();
    const original = event.originalEvent ?? event;
    const target = event.currentTarget ?? event.target?.closest?.("[data-help-type], .item[data-item-id]");
    if (!target || !this.element?.[0]?.contains(target)) return;
    if (force) {
      event.preventDefault();
      event.stopPropagation();
    }
    this._openContextHelp(target, original.clientX, original.clientY);
  }

  _openContextHelp(target, x, y, { hover = false } = {}) {
    const entry = target.dataset.itemId ? this._itemHelp(target.dataset.itemId) : helpEntry(target.dataset.helpType, target.dataset.helpKey);
    if (!entry) return;
    const rect = target.getBoundingClientRect?.();
    const left = Number.isFinite(x) ? x : (rect?.left ?? 24);
    const top = Number.isFinite(y) ? y : (rect?.bottom ?? 24);
    this._renderHelpPopover(entry, left, top, { hover });
  }

  _itemHelp(itemId) {
    const item = this.actor.items.get(itemId);
    if (!item) return null;
    const system = item.system ?? {};
    const details = [];
    if (item.type) details.push(`Tipo: ${item.type}`);
    if (system.equipado !== undefined) details.push(system.equipado ? "Equipado" : "No equipado");
    if (system.uso) details.push(`Uso: ${system.uso}`);
    if (system.automatismo) details.push(`Automatismo: ${system.automatismo}`);
    if (system.habilidadUso) details.push(`Tirada: ${labelForSkill(system.habilidadUso)} DF ${system.dificultadUso || IMSERSO.srd.defaultDifficulty}`);
    if (item.type === "arma") {
      details.push(`Ataque: ${attackConfig(system.tipo)?.label ?? system.tipo ?? "sin armas"}`);
      details.push(`Habilidad: ${labelForSkill(system.habilidad)}`);
      details.push(`Daño: ${system.danoBase ?? 0} + ${String(system.atributoDano ?? "").toUpperCase()}`);
      details.push(`Iniciativa: +${system.iniciativa ?? 0}`);
    }
    if (item.type === "armadura") {
      details.push(`Proteccion al daño: ${system.nivel ?? 0}`);
      details.push(`Penalizador: ${system.penalizador ?? 0}`);
    }
    if (item.type === "escudo") {
      details.push(`Proteccion a Agilidad: +${system.nivel ?? 0}`);
      details.push(`Penalizador: ${system.penalizador ?? 0}`);
    }
    if (item.type === "poder") {
      details.push(`Habilidad: ${labelForSkill(system.habilidad)}`);
      details.push(`Dificultad: ${system.dificultad ?? IMSERSO.srd.mediaDifficulty}`);
      if (system.tipo) details.push(`Tipo: ${system.tipo}`);
    }
    return {
      title: item.name,
      subtitle: item.type === "arma" ? "Arma usable desde la ficha" : item.type === "armadura" ? "Proteccion equipada" : item.type === "escudo" ? "Defensa equipada" : item.type === "poder" ? "Poder o magia usable" : item.type === "talento" ? "Talento o ayuda especial" : item.type === "arquetipo" ? "Plantilla aplicable a una ficha de PJ" : "Objeto de pertenencias",
      body: system.descripcion || system.uso || "Sin descripción escrita.",
      details
    };
  }

  _renderHelpPopover(entry, x, y, { hover = false } = {}) {
    document.querySelectorAll(".ims-context-help").forEach((el) => el.remove());
    const pop = document.createElement("aside");
    pop.className = `ims-context-help${hover ? " hover-help" : ""}`;
    pop.innerHTML = `
      <button type="button" class="ims-help-close" aria-label="Cerrar"><i class="fas fa-xmark"></i></button>
      <header>
        <span>Ayuda rápida</span>
        <h2>${this._escape(entry.title)}</h2>
        ${entry.subtitle ? `<p>${this._escape(entry.subtitle)}</p>` : ""}
      </header>
      <div class="ims-help-body">
        <p>${this._escape(entry.body)}</p>
        ${entry.details?.length ? `<ul>${entry.details.map((line) => `<li>${this._escape(line)}</li>`).join("")}</ul>` : ""}
      </div>`;
    document.body.appendChild(pop);
    const rect = pop.getBoundingClientRect();
    const left = Math.min(window.innerWidth - rect.width - 12, Math.max(12, x + 10));
    const top = Math.min(window.innerHeight - rect.height - 12, Math.max(12, y + 10));
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.querySelector(".ims-help-close")?.addEventListener("click", () => pop.remove());
    if (hover) {
      pop.addEventListener("mouseenter", () => this._clearContextHelpTimer());
      pop.addEventListener("mouseleave", () => pop.remove());
    }
    const close = (ev) => {
      if (!pop.contains(ev.target)) {
        pop.remove();
        document.removeEventListener("mousedown", close, true);
      }
    };
    window.setTimeout(() => document.addEventListener("mousedown", close, true), 0);
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}

export class ImsersoItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["imserso", "sheet", "item"],
      width: 560,
      height: 390,
      resizable: true,
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false
    });
  }

  get template() {
    return `systems/${IMSERSO.ID}/templates/item/item-sheet.hbs`;
  }

  async getData() {
    const context = await super.getData();
    context.system = this.item.system;
    context.descripcionTexto = stripHtmlDescription(this.item.system?.descripcion ?? "");
    context.config = IMSERSO;
    const protectionLevel = Number(this.item.system?.nivel) || 0;
    context.protectionPenalty = this.item.type === "armadura"
      ? Math.floor(protectionLevel / 2)
      : this.item.type === "escudo"
        ? protectionLevel
        : 0;
    context.automationOptions = [
      { value: "", label: "Sin automatismo" },
      { value: "botiquin", label: "Botiquin: Auxilio DF 10, cura 2/4" }
    ];
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;
    html.find("[data-item-chat]").on("click", () => this.item.mostrarEnChat());
    html.find("[data-item-use]").on("click", () => this.item.usar());
  }
}

function stripHtmlDescription(value) {
  const raw = String(value ?? "");
  if (!raw.includes("<")) return raw;
  const withoutImages = raw.replace(/<img\b[^>]*>/gi, "");
  const withBreaks = withoutImages
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const div = document.createElement("div");
  div.innerHTML = withBreaks;
  return (div.textContent ?? div.innerText ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
