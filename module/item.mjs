import { IMSERSO } from "./config.mjs";

export class ImsersoItem extends Item {
  async usar() {
    if (this.type === "arquetipo") {
      if (!this.actor) return this.mostrarEnChat();
      return this.actor.applyArchetype(this.system?.arquetipoKey || this.name, this.system);
    }
    if (this.type === "arma") {
      if (!this.actor) return ui.notifications.warn("Arrastra el arma a una ficha antes de usarla para atacar.");
      return this.actor.rollAttack({ item: this });
    }
    if (this.type === "poder") {
      if (!this.actor) return this.mostrarEnChat();
      return this.actor.rollPower(this);
    }
    if (["armadura", "escudo"].includes(this.type)) {
      if (!this.actor) return this.mostrarEnChat();
      const next = !this.system.equipado;
      await this.update({ "system.equipado": next });
      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `
          <div class="ims-chat-card ims-item-card">
            <header><img src="${this.img}" alt=""><h3>${this.name}</h3></header>
            <p><strong>${this.actor.name}</strong> ${next ? "equipa" : "desequipa"} ${this.name}. Las protecciones se recalculan automaticamente.</p>
          </div>`
      });
    }
    if (!this.actor) return this.mostrarEnChat();
    const automation = this._automationKey();
    if (automation === "botiquin" || automation === "curacion") return this.actor.useHealingItem(this);
    if (this.system?.habilidadUso) {
      await this.mostrarEnChat();
      return this.actor.rollSkill(this.system.habilidadUso, { dificultad: Number(this.system.dificultadUso) || IMSERSO.srd.defaultDifficulty });
    }
    return this.mostrarEnChat();
  }

  async mostrarEnChat() {
    const description = this.system.descripcion ?? this.system.uso ?? "";
    const descriptionHtml = descriptionToHtml(description);
    const content = `
      <div class="ims-chat-card ims-item-card">
        <header><img src="${this.img}" alt=""><h3>${this.name}</h3></header>
        ${descriptionHtml}
      </div>`;
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content });
  }

  _automationKey() {
    const raw = this.system?.automatismo || this.system?.uso || this.name || "";
    return String(raw)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

function descriptionToHtml(value) {
  const raw = decodeHtmlEntities(String(value ?? "").trim());
  if (!raw) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function decodeHtmlEntities(value) {
  if (!String(value).includes("&") || !globalThis.document) return String(value ?? "");
  const div = document.createElement("div");
  div.innerHTML = value;
  return div.textContent ?? div.innerText ?? String(value ?? "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
