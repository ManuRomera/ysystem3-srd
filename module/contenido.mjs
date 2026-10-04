/**
 * Contenido de los compendios. `scripts/build.mjs` lo compila a LevelDB; nada de aquí se siembra en caliente.
 * Los textos de reglas, talentos y ejemplos de PNJ proceden del SRD de Ysystem3 (© Walhalla Ediciones, CC BY 4.0).
 */
import { readFileSync } from "node:fs";
import { TALENTOS_SRD } from "./talentos-data.mjs";
import { ARQUETIPO_ITEMS } from "./arquetipos-data.mjs";
import { DUNGEONS_YAYOS_PACKS } from "./dungeons-yayos-data.mjs";
import { CONJUNTOS, normalizarHabilidades, REGLAS_OPCIONALES, VARIANTES } from "./config.mjs";
import * as R from "./reglas.mjs";

const IC = n => `systems/ysystem3-srd/assets/iconos/${n}.svg`;
const SRD = JSON.parse(readFileSync(new URL("../_data/reglas-srd.json", import.meta.url), "utf8"));
const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CC = `<p class="ys-licencia">Texto del SRD de Ysystem3, © Walhalla Ediciones (Ignacio Sánchez Aranda y Jorge Carrero Roig), publicado bajo licencia
<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Fuente: <a href="https://walhallaediciones.gitlab.io/ysystem/srd/">walhallaediciones.gitlab.io/ysystem/srd</a>. Sin cambios de contenido; se han retirado la maquetación web y los iconos.</p>`;

/* ---------------- Reglas ---------------- */

export function reglas() {
  const capitulos = SRD.map(c => ({
    name: c.name,
    pages: c.pages.map((p, i) => ({ name: c.pages.length > 1 ? p.name : c.name, title: { show: c.pages.length > 1, level: 1 }, text: `<article class="ys-rules-journal">${p.html}${i === c.pages.length - 1 ? CC : ""}</article>` }))
  }));
  const guia = {
    name: "0 · Guía del sistema de Foundry",
    pages: [
      { name: "Cómo funciona", text: `<article class="ys-rules-journal"><h1>Ysystem3 SRD para Foundry</h1>
<p>Sistema <b>no oficial</b> que automatiza el reglamento genérico de Walhalla Ediciones. Las reglas completas están en los capítulos 1 a 8 de este compendio.</p>
<h2>Lo esencial</h2>
<ul><li><b>Tirar:</b> pulsa el nombre de una habilidad. El diálogo suma profesión (+3), proeza (+1D), Recuerdo cuando… (+2D), acciones combinadas, ayudas y oscuridad, aplica el tope de 5D y los penalizadores de Salud y protecciones, y toma la dificultad del <b>token marcado</b> (Agilidad, Aplomo o Perspicacia).</li>
<li><b>Repetir:</b> en la tarjeta del chat, «Repetir con proeza» (eliges los dados; sin críticos). El DJ ve los botones de <b>defecto grave y leve</b>: repiten la tirada y dan la proeza.</li>
<li><b>Atacar:</b> marca un objetivo y pulsa el icono del arma. Apuntar, noquear, ráfagas, cobertura, proezas al daño (dados explosivos) y crítico (daño fijo ×2 e ignora armadura) se resuelven solos; el daño queda <b>pendiente</b> hasta que alguien pulsa «Aplicar».</li>
<li><b>Salud y Estabilidad:</b> al cruzar 16, 11, 7, 4 y 2 por primera vez en la sesión aparece la tarjeta de umbrales con un botón de Resistencia por cada uno.</li>
<li><b>DJ:</b> el Panel del DJ (icono de corona) reúne pánico, nueva sesión, nuevo día, nueva aventura, Experiencia, tortura y duelos.</li></ul>
<h2>Edición y ambientación</h2>
<p>En Configuración → Ajustes del sistema eliges entre <b>Ysystem3 (SRD 2026)</b> y <b>Edición Revisada (2023)</b>, y la ambientación (pulp, fantasía, ciencia ficción, horror lovecraftiano, capa y espada, ciberpunk, terror contemporáneo, <b>IMSERSO to the Limit</b> y <b>Dungeons &amp; Yayos</b>).</p></article>` },
      { name: "Edición Revisada frente a Ysystem3", text: `<article class="ys-rules-journal"><h1>Diferencias entre ediciones</h1>
<p>El sistema aplica estas cifras según la edición elegida. Todo lo que no aparece es igual en ambas.</p>
<table><thead><tr><th>Regla</th><th>Ysystem3 (SRD 2026)</th><th>Edición Revisada (2023)</th></tr></thead><tbody>
<tr><td>Tope de dados en una tirada</td><td>5D</td><td>Sin tope</td></tr>
<tr><td>Bonificador de profesión (+3)</td><td>PJ y PNJ</td><td>Solo PJ</td></tr>
<tr><td>Punto de guion</td><td>1 por sesión o aventura</td><td>No existe</td></tr>
<tr><td>Oscuridad (+5 a la dificultad)</td><td>12 habilidades, Ocultación −5</td><td>9 habilidades, sin cambio en Ocultación</td></tr>
<tr><td>Daño sin armas especial / FUE dos manos</td><td>2 + FUE/2 / FUE × 1,5</td><td>No hay nivel especial / FUE íntegra</td></tr>
<tr><td>Daño del arma de fuego larga</td><td>11 + PER</td><td>10 + PER</td></tr>
<tr><td>Crítico en ataque</td><td>Daño fijo ×2 e ignora armadura</td><td>Daño ×2 (la armadura cuenta)</td></tr>
<tr><td>Ráfagas</td><td>+2 por blanco, cargador vacío con 1-2, daño con PER</td><td>+2 por blanco (máx. +10), vacío con 1, daño sin PER</td></tr>
<tr><td>Explosivos</td><td>25 / 50 / 100 (−2 / −1 / −½ por metro)</td><td>20 / 40 (−2 / −1 por metro)</td></tr>
<tr><td>Ataques combinados</td><td>+2 por colaborador (máx. +10)</td><td>Además suman daño</td></tr>
<tr><td>Protecciones</td><td>Penalizan solo DES y FUE</td><td>Penalizan todas las habilidades</td></tr>
<tr><td>Caída</td><td>3 por metro desde 2 m</td><td>3 por metro desde 1 m</td></tr>
<tr><td>Frío / hambre</td><td>1 por 15 min / 1 por 24 h</td><td>1 por 5 min / 1 por 12 h</td></tr>
<tr><td>Curación por día</td><td>Hospital 2, reposo 1, Auxilio 2, Psicología 2</td><td>Hospital 4, reposo 2, medicamentos 1-2, apoyo +1, Auxilio 2</td></tr>
<tr><td>Un defecto sobre un crítico</td><td>Lo anula</td><td>No se puede</td></tr>
</tbody></table></article>` },
      { name: "Reglas opcionales y variantes", text: `<article class="ys-rules-journal"><h1>Reglas opcionales</h1>
<p>Se activan en los ajustes del mundo. Las marcadas «hack» vienen del libro de Ysystem (no son oficiales); las demás figuran en el SRD.</p>
<ul>${Object.values(REGLAS_OPCIONALES).map(r => `<li><b>${esc(r.label)}.</b> ${esc(r.hint)}</li>`).join("")}</ul>
<h2>Ambientaciones</h2>
<ul>${Object.values(VARIANTES).map(v => `<li><b>${esc(v.label)}.</b> ${CONJUNTOS[v.conjunto].id === "srd" ? `Reglas del SRD${v.pulp ? " con el Anexo Pulp" : ""}${v.reglas.length ? `; recomienda: ${v.reglas.map(r => esc(REGLAS_OPCIONALES[r].label)).join(", ")}` : ""}.` : `Reglas de YayoSystem (${esc(CONJUNTOS[v.conjunto].titulo)}): ${Object.keys(CONJUNTOS[v.conjunto].atributos).length} atributos, ${Object.keys(CONJUNTOS[v.conjunto].habilidades).length} habilidades, ${esc(CONJUNTOS[v.conjunto].fijos.agilidad)} y ${esc(CONJUNTOS[v.conjunto].fijos.aplomo)} como valores fijos.`}</li>`).join("")}</ul></article>` }
    ]
  };
  return [guia, ...capitulos];
}

/* ---------------- Objetos ---------------- */

const d = (name, type, system, img = IC(type)) => ({ name, type, img, system });

export const talentos = () => TALENTOS_SRD.map(t => d(t.nombre, "talento", {
  descripcion: t.descripcion, categoria: t.categoria, usos: { valor: t.usos, max: t.usos }, frecuencia: t.frecuencia, equipado: false, automatismo: "", habilidadUso: "", dificultadUso: 9
}));

const arma = (name, tipo, habilidad, atributoDano, descripcion, extra = {}) => {
  const base = R.EDICIONES.y3.dano[tipo];
  return d(name, "arma", { tipo, habilidad, danoBase: base, atributoDano, iniciativa: 0, descripcion, equipado: false, automatismo: "", alcance: "", ...extra });
};

export const armas = () => [
  arma("Puños y patadas", "desarmado", "lucha", "fue", "Arañazo, cabezazo, codazo, mordisco, patada, puñetazo, rodillazo. Daño 1 + FUE/2."),
  arma("Artes marciales", "desarmadoEspecial", "lucha", "fue", "Golpe de artista marcial o puñetazo con puño americano. Daño 2 + FUE/2."),
  arma("Cuchillo", "cuerpoUnaMano", "lucha", "fue", "Arma de filo corta. Daño 3 + FUE."),
  arma("Espada", "cuerpoUnaMano", "lucha", "fue", "Arma de filo a una mano. Daño 3 + FUE."),
  arma("Maza o garrote", "cuerpoUnaMano", "lucha", "fue", "Arma contundente a una mano o improvisada. Daño 3 + FUE."),
  arma("Hacha de guerra a dos manos", "cuerpoDosManos", "lucha", "fue", "Arma de gran tamaño. Daño 3 + FUE × 1,5 (hacia abajo)."),
  arma("Arco", "distancia", "punteria", "per", "Arma de proyectiles. Daño 3 + PER."),
  arma("Ballesta", "distancia", "punteria", "per", "Arma de proyectiles. Daño 3 + PER."),
  arma("Pistola o revólver", "fuegoCorto", "punteria", "per", "Arma de fuego corta. Daño 7 + PER. Desenfundar: −1D en el primer turno."),
  arma("Escopeta o rifle", "fuegoLargo", "punteria", "per", "Arma de fuego larga: carabina, escopeta, fusil, rifle o subfusil. Daño 11 + PER (Edición Revisada: 10 + PER)."),
  arma("Fusil de asalto", "fuegoLetal", "punteria", "per", "Arma de fuego mortífera y automática: admite ráfagas. Daño 15 + PER."),
  arma("Ametralladora", "fuegoLetal", "punteria", "per", "Arma de fuego mortífera y automática: admite ráfagas. Daño 15 + PER."),
  arma("Pistola de electrochoque (TASER)", "fuegoCorto", "punteria", "per", "Se sacrifica 1D de la tirada. No hace daño normal: 1 + PER/2 y Fuerza bruta a dificultad 20 o incapacitado 3D minutos (usa «Otras fuentes de daño → Electrochoque»).", { danoBase: 1 }),
  arma("Arma láser o bláster", "fuegoLargo", "punteria", "per", "Ciencia ficción: bláster normal. Daño 11 + PER; los grandes, a discreción del DJ.")
];

const prot = (name, type, nivel, descripcion) => d(name, type, { nivel, penalizador: 0, equipado: false, automatismo: "", descripcion });
export const protecciones = () => [
  prot("Cuero acolchado", "armadura", 1, "Nivel 1: resta 1 al daño y no penaliza."),
  prot("Cuero tachonado", "armadura", 2, "Nivel 2: resta 2 al daño y penaliza 1."),
  prot("Cota de malla", "armadura", 3, "Nivel 3: resta 3 al daño y penaliza 1."),
  prot("Coraza de placas", "armadura", 4, "Nivel 4: resta 4 al daño y penaliza 2."),
  prot("Armadura de placas completa", "armadura", 5, "Nivel 5: resta 5 al daño y penaliza 2 a las habilidades afectadas (la mitad del nivel, hacia abajo)."),
  prot("Chaleco antibalas", "armadura", 3, "Nivel 3: resta 3 al daño y penaliza 1."),
  prot("Adarga", "escudo", 1, "Nivel 1: suma 1 a la Agilidad y penaliza 1."),
  prot("Rodela", "escudo", 2, "Nivel 2: suma 2 a la Agilidad y penaliza 2."),
  prot("Escudo grande", "escudo", 3, "Nivel 3: suma 3 a la Agilidad y penaliza 3.")
];

const poder = (name, tipo, atributo, dificultad, contra, descripcion, extra = {}) =>
  d(name, "poder", { tipo, habilidad: "magia", atributo, dificultad, contra, costeExtra: 0, preparacion: "", lanzamiento: "", duracion: "", caducidad: "", equipado: false, automatismo: "", descripcion, ...extra });
export const poderes = () => [
  poder("Dardo de fuego", "Hechizo ofensivo", "int", 8, "agilidad", "Un proyectil de llama alcanza al objetivo. Daño a criterio del DJ (sugerido: 7 + INT).", { lanzamiento: "Instantáneo" }),
  poder("Sanar heridas", "Hechizo", "int", 12, "", "Recupera 3 puntos de Salud de quien se toca.", { lanzamiento: "Un turno", duracion: "Instantánea" }),
  poder("Barrera de luz", "Hechizo", "int", 12, "", "Una pared de luz sube +3 a la Agilidad de los aliados cercanos mientras se mantiene.", { duracion: "Mantenido" }),
  poder("Orden mental", "Poder psiónico", "car", 12, "aplomo", "El objetivo obedece una orden sencilla durante un turno.", { lanzamiento: "Un turno" }),
  poder("Telequinesis", "Poder psiónico", "int", 8, "", "Mueve a distancia un objeto pequeño.", { duracion: "Mantenido" }),
  poder("Asalto mental", "Poder psiónico", "int", 16, "aplomo", "Sobrecarga sensorial: −1D a las acciones del objetivo durante 3 turnos.", { duracion: "3 turnos", costeExtra: 2 })
];

export const plantillas = () => ARQUETIPO_ITEMS;

/* ---------------- PNJ de ejemplo (anexo del cap. 7) ---------------- */

const pnj = (name, ref, nota, ataques, salud, rf) => {
  const a = ref.atributos;
  const hab = normalizarHabilidades({});
  for (const k of ["atletismo", "fuerzaBruta", "lucha", "punteria"]) hab[k] = { dados: ataques.dados };
  return {
    name, type: "pnj", img: "icons/svg/mystery-man.svg",
    system: {
      descripcion: ref.nota, bando: "Hostil", rol: ref.nota, atributos: a, habilidades: hab, salud: { valor: salud, max: salud },
      agilidad: { valor: R.agilidad(ataques.dados, a.des), manual: false }, aplomo: { valor: R.aplomo(a.car, a.int), manual: false }, perspicacia: { valor: R.perspicacia(a.int, a.per), manual: false },
      resistenciaFisica: { valor: rf, manual: false }, ataque: { nombre: ataques.nombre, habilidad: "lucha", tipo: ataques.tipo, dano: 0 }, notas: nota
    },
    prototypeToken: { name, actorLink: false, disposition: -1, bar1: { attribute: "salud" } }
  };
};
export const pnjs = () => [
  pnj("PNJ oponente genérico débil", R.REFERENCIAS_PNJ.debil, "Salud 17 · Iniciativa +3. Combate sin armas (1D+2) daño 2; arma blanca (1D+2) daño 5. Ejemplo del anexo del capítulo 7 del SRD.", { dados: 1, nombre: "Arma blanca", tipo: "cuerpoUnaMano" }, 17, 10),
  pnj("PNJ oponente genérico fuerte", R.REFERENCIAS_PNJ.fuerte, "Salud 21 · Iniciativa +6. Combate sin armas daño 3; arma blanca daño 7; arma de fuego corta daño 10. Ejemplo del anexo del capítulo 7 del SRD.", { dados: 2, nombre: "Arma blanca", tipo: "cuerpoUnaMano" }, 21, 8),
  pnj("PNJ oponente genérico muy fuerte", R.REFERENCIAS_PNJ.muyFuerte, "Salud 25 · Iniciativa +12. Lucha y Puntería a 3D. Arma blanca daño 9; fuego corta 11; mortífera 19. Ejemplo del anexo del capítulo 7 del SRD.", { dados: 2, nombre: "Arma de fuego corta", tipo: "fuegoCorto" }, 25, 6),
  pnj("Gran antagonista", R.REFERENCIAS_PNJ.antagonista, "Salud 30 · Iniciativa +12. Todas las habilidades a 3D. Arma blanca daño 11; fuego corta 12; mortífera 20. Ejemplo del anexo del capítulo 7 del SRD.", { dados: 3, nombre: "Arma de fuego mortífera", tipo: "fuegoLetal" }, 30, 4)
];

/* ---------------- Tablas y macros ---------------- */

export function tablas() {
  const pulp = {
    name: "Tabla de salvación ¡PULP!", img: "icons/svg/d20-grey.svg", formula: "3d6", description: "Anexo Pulp: tirada de salvación in extremis (una vez por aventura). Lo logro o lo evito gracias a…",
    results: Object.entries(R.TABLA_PULP).map(([t, texto]) => ({ text: texto, range: [Number(t), Number(t)] }))
  };
  const sucesos = {
    name: "Sucesos inesperados en persecuciones", img: "icons/svg/d20-grey.svg", formula: "2d6", description: "Cap. 6: cada PJ directamente implicado tira 2D al final de cada turno de persecución.",
    results: R.SUCESOS.map(s => ({ text: `${s.titulo}. ${s.texto}`, range: [s.desde, s.hasta] }))
  };
  const defectos = {
    name: "Defectos de ejemplo", img: "icons/svg/d20-grey.svg", formula: "1d12", description: "Defectos que cita el SRD como ejemplo (cap. 3). Los dos de un PJ deben ser muy distintos.",
    results: ["Olor lumbar", "Codicioso", "Duro de oído", "Inseguro", "Feo", "Obsesivo", "Sobrepeso", "Mentiroso compulsivo", "Taquifemia", "Irascible", "Patológicamente distraído", "Osteocondritis en la rodilla izquierda"].map((t, i) => ({ text: t, range: [i + 1, i + 1] }))
  };
  return [pulp, sucesos, defectos];
}

const macro = (name, command, icon = "icons/svg/dice-target.svg") => ({ name, type: "script", img: icon, scope: "global", command });
export const macros = () => [
  macro("Panel del DJ", "game.ysystem3Srd.abrirPanel();", "icons/svg/crown.svg"),
  macro("Asistente de PJ", "game.ysystem3Srd.abrirCreador();", "icons/svg/mystery-man.svg"),
  macro("Pánico (objetivos marcados)", "const dianas = [...game.user.targets].map(t => t.actor).filter(a => a?.type === 'personaje');\nif (!dianas.length) ui.notifications.warn('Marca a uno o varios PJ.');\nelse game.ysystem3Srd.lanzarPanico(dianas, { dados: 3 });", "icons/svg/terror.svg"),
  macro("Tirar iniciativa de los marcados", "for (const t of canvas.tokens.controlled) await t.actor?.rollInitiative({ createCombatants: true });", "icons/svg/clockwork.svg")
];

/* ---------------- Definición de packs ---------------- */

const yy = nombre => DUNGEONS_YAYOS_PACKS.find(p => p.name === nombre);

export const PACKS = {
  "reglas-ysystem3": { tipo: "JournalEntry", docs: reglas },
  "talentos-ysystem3": { tipo: "Item", docs: talentos },
  "poderes-ysystem3": { tipo: "Item", docs: poderes },
  "armas-ysystem3": { tipo: "Item", docs: armas },
  "protecciones-ysystem3": { tipo: "Item", docs: protecciones },
  "plantillas-ysystem3": { tipo: "Item", docs: plantillas },
  "pnj-ysystem3": { tipo: "Actor", docs: pnjs },
  "tablas-ysystem3": { tipo: "RollTable", docs: tablas },
  "macros-ysystem3": { tipo: "Macro", docs: macros },
  "dungeons-yayos-reglas": { tipo: "JournalEntry", docs: () => yy("dungeons-yayos-reglas").data },
  "dungeons-yayos-hechizos": { tipo: "Item", docs: () => yy("dungeons-yayos-hechizos").data },
  "dungeons-yayos-armas": { tipo: "Item", docs: () => yy("dungeons-yayos-armas").data },
  "dungeons-yayos-protecciones": { tipo: "Item", docs: () => yy("dungeons-yayos-protecciones").data },
  "dungeons-yayos-pj": { tipo: "Actor", docs: () => yy("dungeons-yayos-pj").data }
};
