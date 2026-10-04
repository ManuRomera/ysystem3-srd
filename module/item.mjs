/**
 * Objeto de Ysystem3: armas, equipo, protecciones, poderes, talentos y arquetipos.
 * `usar()` es el botón de dado de la hoja: ataca, lanza, activa, equipa o tira según el objeto.
 */
import { publicar } from "./chat.mjs";
import { claveAutomatismo } from "./reglas.mjs";

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export class ItemYsystem3 extends Item {
  get automatismo() { return claveAutomatismo(this.system.automatismo || this.system.uso || ""); }

  async usar() {
    const actor = this.actor;
    if (this.type === "arquetipo") return actor ? actor.aplicarArquetipo(this.system.arquetipoKey || this.name, this.system) : this.mostrarEnChat();
    if (!actor) return this.type === "arma" ? ui.notifications.warn("Arrastra el arma a una ficha antes de usarla.") : this.mostrarEnChat();
    if (this.type === "arma") return actor.atacar({ item: this });
    if (this.type === "poder") return actor.lanzarPoder(this);
    if (this.type === "talento") return actor.usarTalento(this);
    if (this.type === "armadura" || this.type === "escudo") return this.alternarEquipado(true);
    if (["botiquin", "curacion"].includes(this.automatismo)) return actor.curacionRegla();
    if (this.system.habilidadUso) {
      await this.mostrarEnChat();
      return actor.tirarHabilidad(this.system.habilidadUso, { dificultad: n(this.system.dificultadUso, 9) });
    }
    return this.mostrarEnChat();
  }

  /** Equipar o desequipar. Una sola arma, una sola armadura y un solo escudo a la vez. */
  async alternarEquipado(avisar = false) {
    const equipar = !this.system.equipado;
    if (equipar && this.actor && ["arma", "armadura", "escudo"].includes(this.type)) {
      const otras = this.actor.items.filter(i => i.type === this.type && i.id !== this.id && i.system.equipado).map(i => ({ _id: i.id, "system.equipado": false }));
      if (otras.length) await this.actor.updateEmbeddedDocuments("Item", otras);
    }
    await this.update({ "system.equipado": equipar });
    if (avisar && this.actor) {
      await publicar({
        tono: "aviso", icono: "fa-solid fa-shield-halved", etiqueta: "Equipo", titulo: this.name, img: this.img,
        texto: `${this.actor.name} ${equipar ? "se equipa" : "se quita"} ${this.name}. Las protecciones se recalculan solas.`
      }, { actor: this.actor });
    }
  }

  async mostrarEnChat() {
    const s = this.system;
    const lineas = [];
    if (this.type === "armadura") lineas.push({ texto: `Nivel ${s.nivel}: resta ${s.nivel} al daño y penaliza ${Math.floor(s.nivel / 2)} a las habilidades afectadas.` });
    if (this.type === "escudo") lineas.push({ texto: `Nivel ${s.nivel}: suma ${s.nivel} a la Agilidad y penaliza ${s.nivel} a las habilidades afectadas.` });
    if (this.type === "poder") lineas.push({ texto: `Dificultad ${s.dificultad}${s.contra ? ` · contra ${s.contra}` : ""}` });
    return publicar({
      tono: "item", icono: "fa-solid fa-suitcase", etiqueta: game.i18n.localize(`TYPES.Item.${this.type}`), titulo: this.name, img: this.img,
      texto: s.descripcion || s.uso || s.talento || "", lineas
    }, { actor: this.actor ?? undefined });
  }
}
