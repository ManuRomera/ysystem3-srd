/**
 * Lupa: al dejar el cursor sobre un retrato o imagen marcada con `data-lupa` se enseña grande junto a ella.
 * Vale para el chat, el panel del DJ, las hojas y el directorio. Se oculta al salir, pulsar, desplazar o con Escape.
 * Cada persona la activa o no en Ajustes (es de este navegador).
 */
import { ID } from "./config.mjs";

const SELECTOR = "img.ys-retrato, img.ys-tc-img, img[data-lupa]";
const RETRASO = 220;

export function registrarLupa() {
  game.settings.register(ID, "lupa", {
    name: "Ampliar imágenes al pasar el ratón",
    hint: "Al dejar el cursor sobre un retrato o una imagen se muestra en grande. Ajuste de este navegador.",
    scope: "client", config: true, type: Boolean, default: true
  });

  let caja = null, actual = null, espera = 0;
  const ocultar = () => { clearTimeout(espera); actual = null; caja?.remove(); caja = null; };

  const mostrar = img => {
    const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
    const alto = Math.min(window.innerHeight * 0.9, ratio < 1 ? 760 : 520);
    const ancho = Math.min(alto * ratio, window.innerWidth * 0.46);
    const rect = img.getBoundingClientRect();
    const aLaDerecha = rect.left + rect.width / 2 < window.innerWidth / 2;
    const izquierda = aLaDerecha ? Math.min(rect.right + 18, window.innerWidth - ancho - 12) : Math.max(rect.left - ancho - 18, 12);
    const arriba = Math.min(Math.max(rect.top + rect.height / 2 - alto / 2, 10), window.innerHeight - alto - 10);
    caja = document.createElement("div");
    caja.className = "ys-lupa";
    caja.setAttribute("aria-hidden", "true");
    Object.assign(caja.style, { left: `${izquierda}px`, top: `${arriba}px`, width: `${ancho}px`, height: `${alto}px` });
    const grande = new Image();
    grande.src = img.currentSrc || img.src;
    grande.alt = "";
    caja.append(grande);
    document.body.append(caja);
  };

  document.addEventListener("pointerover", ev => {
    if (ev.pointerType === "touch" || !game.settings.get(ID, "lupa")) return;
    const img = ev.target instanceof Element ? ev.target.closest(SELECTOR) : null;
    if (!img || img === actual || img.closest(".ys-lupa")) return;
    ocultar();
    actual = img;
    espera = setTimeout(() => { if (actual === img && img.isConnected) mostrar(img); }, RETRASO);
  });
  document.addEventListener("pointerout", ev => {
    if (actual && ev.target instanceof Element && ev.target.closest(SELECTOR) === actual && !actual.contains(ev.relatedTarget)) ocultar();
  });
  for (const tipo of ["pointerdown", "wheel", "keydown", "blur"]) window.addEventListener(tipo, ocultar, { passive: true, capture: true });
}
