/**
 * Reglas de Ysystem como funciones puras (sin Foundry): se prueban con `npm test`.
 * Cada función cita el capítulo del SRD de Ysystem3 (walhallaediciones.gitlab.io/ysystem/srd) del que sale
 * y, donde difiere, la regla de la Edición Revisada («ER»). El resto del sistema no conoce cifras: las pide aquí.
 *
 * Dos ejes de variación:
 *  - EDICIONES: Ysystem3 (SRD 2026) o Edición Revisada (2023); solo cambian las cifras que el SRD recalibró.
 *  - CONJUNTOS (config.mjs): SRD, IMSERSO to the limit o Dungeons & Yayos; cambian atributos, habilidades y valores fijos.
 */
import { CONJUNTOS } from "./config.mjs";

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const suelo = Math.floor;

export const UMBRALES = [16, 11, 7, 4, 2];
export const BONIFICADORES_PJ = [0, 1, 2, 4, 6];
export const DISTANCIAS = ["corta", "media", "larga", "muy larga"];

/* ------------------------------------------------------------------ */
/* Ediciones                                                          */
/* ------------------------------------------------------------------ */

const OSCURIDAD_Y3 = ["atletismo", "auxilio", "conducir", "entorno", "informacion", "lucha", "mecanica", "observacion", "psicologia", "punteria", "rastreo", "supervivencia"];
const OSCURIDAD_ER = ["auxilio", "conducir", "entorno", "informacion", "mecanica", "observacion", "punteria", "rastreo", "supervivencia"];

/**
 * Diferencias entre la Edición Revisada y Ysystem3 (anuncio oficial de Walhalla y comparación de textos).
 * Todo lo que no figura aquí es igual en ambas.
 */
export const EDICIONES = {
  y3: {
    id: "y3", nombre: "Ysystem3 (SRD 2026)",
    topeDados: 5,                          // cap. 3: nunca más de 5D
    profesionPNJ: true,                    // cap. 3: los PNJ también suman +3
    recuerdoYProeza: "repetir",            // cap. 3: Recuerdo es incompatible con +1D de proeza, no con repetir
    criticoRepetibleConDefecto: true,      // cap. 3: un defecto puede anular un crítico
    puntoGuion: true,                      // cap. 3: punto de guion
    oscuridad: OSCURIDAD_Y3, ocultacionOscuridad: -5,
    dano: { desarmado: 1, desarmadoEspecial: 2, cuerpoUnaMano: 3, cuerpoDosManos: 3, distancia: 3, fuegoCorto: 7, fuegoLargo: 11, fuegoLetal: 15, extramortifero: 0 },
    multDosManos: 1.5,                     // cap. 5: FUE × 1,5 con armas a dos manos
    criticoIgnoraArmadura: true,           // cap. 5
    rafaga: { maxBlancos: 5, porBlanco: 2, tope: null, sumaPER: true, vaciaCon: 2 },
    explosivos: [
      { clave: "menor", etiqueta: "Menor (granada)", dano: 25, porMetro: 2 },
      { clave: "medio", etiqueta: "Medio (cohete)", dano: 50, porMetro: 1 },
      { clave: "mayor", etiqueta: "Mayor (misil)", dano: 100, porMetro: 0.5 }
    ],
    ataqueCombinadoSumaDano: false,
    caida: { porMetro: 3, desde: 2 }, congelacionMinutos: 15, hambreHoras: 24, sedHoras: 6,
    protecciones: "dex-fue",               // cap. 6: la penalización solo afecta a habilidades de DES y FUE
    curacion: {
      hospital: 2, reposo: 1, auxilio: 2, auxilioCritico: 4, auxilioPifia: 2, psicologia: 2, medicamentos: 0, apoyo: 0,
      dormir: 1, contacto: 1, relajante: 1
    }
  },
  er: {
    id: "er", nombre: "Edición Revisada (2023)",
    topeDados: Infinity, profesionPNJ: false, recuerdoYProeza: "incompatible", criticoRepetibleConDefecto: false, puntoGuion: false,
    oscuridad: OSCURIDAD_ER, ocultacionOscuridad: 0,
    dano: { desarmado: 1, desarmadoEspecial: 1, cuerpoUnaMano: 3, cuerpoDosManos: 3, distancia: 3, fuegoCorto: 7, fuegoLargo: 10, fuegoLetal: 15, extramortifero: 0 },
    multDosManos: 1,
    criticoIgnoraArmadura: false,
    rafaga: { maxBlancos: 5, porBlanco: 2, tope: 10, sumaPER: false, vaciaCon: 1 },
    explosivos: [
      { clave: "menor", etiqueta: "Menor (granada)", dano: 20, porMetro: 2 },
      { clave: "mayor", etiqueta: "Mayor (misil)", dano: 40, porMetro: 1 }
    ],
    ataqueCombinadoSumaDano: true,
    caida: { porMetro: 3, desde: 1 }, congelacionMinutos: 5, hambreHoras: 12, sedHoras: 6,
    protecciones: "todas",
    curacion: {
      hospital: 4, reposo: 2, auxilio: 2, auxilioCritico: 4, auxilioPifia: 2, psicologia: 0, medicamentos: 2, apoyo: 1,
      dormir: 1, contacto: 1, relajante: 0
    }
  }
};

export const edicionDe = clave => EDICIONES[clave] ?? EDICIONES.y3;

/* ------------------------------------------------------------------ */
/* Valores derivados (caps. 4, 5, 6 y 7)                              */
/* ------------------------------------------------------------------ */

/** Cap. 5: -1D bajo 11 de Salud, -2D bajo 7, -3D bajo 4 (los PNJ también). */
export const penalizadorSalud = (salud, umbrales = [11, 7, 4]) => umbrales.filter(u => salud < u).length;

/** Cap. 4: Agilidad = 3 × dados de Atletismo + DES. Nervio de YayoSystem es igual. */
export const agilidad = (dadosAtletismo, des) => 3 * n(dadosAtletismo, 1) + n(des);
/** Cap. 4: Aplomo = CAR + INT + 5. */
export const aplomo = (car, int) => n(car) + n(int) + 5;
/** Cap. 4: Perspicacia = INT + PER + 5. */
export const perspicacia = (int, per) => n(int) + n(per) + 5;
/** YayoSystem: Bemoles = CAC + 7 (manual de IMSERSO, p. 19). */
export const bemoles = int => n(int) + 7;
/** Cap. 5 y 6: Resistencia física = 12 − FUE; Resistencia mental = 12 − CAR. */
export const resistenciaFisica = fue => 12 - n(fue);
export const resistenciaMental = car => 12 - n(car);
/** Cap. 5: Salud = FUE × 2 + 10 + 1D (o +6 PJ y PNJ poderosos, +3 resto de PNJ). */
export const saludBase = fue => n(fue) * 2 + 10;
export const saludFija = (fue, poderoso = true) => saludBase(fue) + (poderoso ? 6 : 3);
/** Cap. 6: Estabilidad = Aplomo + 5 + 1D. */
export const estabilidadBase = ap => n(ap) + 5;
/** Cap. 3 y 7: proezas iniciales = (FUE + INT)/2 + 3, redondeando hacia abajo (YayoSystem: +2). */
export const proezasIniciales = (fue, int, extra = 3) => suelo((n(fue) + n(int)) / 2) + extra;
/** Cap. 5 y 7: valor de iniciativa = DES + INT. */
export const iniciativa = (des, int) => n(des) + n(int);

/** Umbrales de Salud o Estabilidad que se cruzan por primera vez al pasar de `antes` a `despues` (cap. 5). */
export function umbralesCruzados(antes, despues, umbrales, yaTirados = {}) {
  return umbrales.filter(u => antes >= u && despues < u && !yaTirados[u]);
}

/** Anexo Pulp: los PJ ignoran el primer umbral (16). */
export const umbralesPulp = umbrales => umbrales.filter(u => u !== Math.max(...umbrales));

/* ------------------------------------------------------------------ */
/* Tiradas (cap. 3)                                                   */
/* ------------------------------------------------------------------ */

const ESPECIALES = new Set(["iniciativa", "panico", "resistenciaFisica", "resistenciaMental", "miedo", "tortura"]);

/**
 * Resultado de una tirada. Crítico: dos o más seises (uno solo con ciertos talentos), siempre éxito;
 * pifia: todos los dados son 1, siempre fallo. Solo las tiradas de habilidad los tienen.
 * `sinCritico`: tras gastar una proeza en repetir ya no se obtienen críticos.
 */
export function evaluar({ caras = [], atributo = 0, bonus = 0, dificultad = 9, tipo = "habilidad", critUnSeis = false, sinCritico = false }) {
  const total = caras.reduce((a, c) => a + c, 0) + n(atributo) + n(bonus);
  const seises = caras.filter(c => c === 6).length;
  const especial = !ESPECIALES.has(tipo);
  const critico = especial && !sinCritico && seises >= (critUnSeis ? 1 : 2);
  const pifia = especial && caras.length > 0 && caras.every(c => c === 1);
  const exito = critico || (!pifia && total >= n(dificultad, 9));
  return { total, seises, critico, pifia, exito };
}

/**
 * Dados reales de una tirada de habilidad (cap. 3 y 5). `base` son los de la ficha.
 * Suma proeza (+1), Recuerdo (+2), dados recibidos de una ayuda y extras; resta los sacrificados al apuntar,
 * el penalizador de Salud, el defecto grave y los prestados. Nunca más de `tope` (5D en Ysystem3).
 */
export function dadosDeTirada({ base, extra = 0, proeza = false, recuerdo = false, recibidos = 0, sacrificados = 0, penalizador = 0, defectoGrave = false, prestados = 0, tope = 5 }) {
  const bruto = n(base) + n(extra) + (proeza ? 1 : 0) + (recuerdo ? 2 : 0) + n(recibidos)
    - n(sacrificados) - n(penalizador) - (defectoGrave ? 1 : 0) - n(prestados);
  return Math.max(0, Math.min(tope, bruto));
}

/** Cap. 3: acciones combinadas = +2 por colaborador, máximo +10 (talento «Buen compañero»: +4 y +12). */
export const combinadas = (colaboradores, { porColaborador = 2, maximo = 10 } = {}) => Math.min(maximo, Math.max(0, n(colaboradores)) * porColaborador);

/** Cap. 4: varios PNJ suman +2 al Aplomo más alto por cada uno por encima del primero, hasta +10. */
export const aplomoDeGrupo = (valores, { porExtra = 2, maximo = 10 } = {}) => {
  if (!valores.length) return 0;
  return Math.max(...valores) + Math.min(maximo, (valores.length - 1) * porExtra);
};

/** Cap. 3: sin luz, +5 a la dificultad de ciertas habilidades; Ocultación baja 5 (solo Ysystem3). */
export function modificadorOscuridad(habilidad, edicion = EDICIONES.y3) {
  if (habilidad === "ocultacion") return edicion.ocultacionOscuridad;
  return edicion.oscuridad.includes(habilidad) ? 5 : 0;
}

/** Cap. 3: gastar proezas para reforzar un valor fijo (+3 cada una, un turno). */
export const refuerzoFijo = proezas => 3 * Math.max(0, n(proezas));

/** Cap. 3: la 2.ª habilidad de Idioma extranjero no se puede usar sin 2D o 3D en la 1.ª. */
export const idiomaDisponible = (dadosPrimero, clave) => clave !== "idiomaExtranjero2" || n(dadosPrimero, 1) >= 2;

/* ------------------------------------------------------------------ */
/* Proezas (cap. 3)                                                   */
/* ------------------------------------------------------------------ */

/** Máximo de proezas que se pueden gastar en el daño de un ataque (2; 3 con armas de fuego). */
export const topeProezasDano = (proezas, max = 2) => Math.min(max, Math.max(0, n(proezas)));

/** Anexo Pulp: al empezar la sesión cada jugador tira 1D y gana la mitad (hacia abajo) en proezas extra. */
export const proezasExtraPulp = dado => suelo(n(dado) / 2);

/** Al terminar la sesión sobran las proezas por encima de las iniciales (cap. 3). */
export const proezasSobrantes = (actuales, iniciales) => Math.max(0, n(actuales) - n(iniciales));

/* ------------------------------------------------------------------ */
/* Combate (cap. 5)                                                   */
/* ------------------------------------------------------------------ */

/** Orden de iniciativa: DES, luego INT, PER, Agilidad y por último el más joven (cap. 5). */
export function desempateIniciativa({ des = 0, int = 0, per = 0, agil = 0, edad = 99 }) {
  return n(des) * 1e-2 + n(int) * 1e-4 + n(per) * 1e-6 + n(agil) * 1e-8 + (100 - Math.min(99, n(edad, 99))) * 1e-11;
}

/** Cap. 5: valor de Agilidad en un asalto concreto. */
export function agilidadEfectiva({ base, escudo = 0, refuerzos = 0, defensa = 0, cobertura = 0, rafagaBlancos = 0, edicion = EDICIONES.y3, sorprendido = false, inmovilizado = false }) {
  let valor = n(base) + n(escudo) + refuerzoFijo(refuerzos) + n(defensa);
  if (sorprendido) valor = suelo(valor / 2);
  if (inmovilizado) valor = suelo(valor / 2);
  valor += n(cobertura);
  if (rafagaBlancos) {
    const extra = n(rafagaBlancos) * edicion.rafaga.porBlanco;
    valor += edicion.rafaga.tope ? Math.min(edicion.rafaga.tope, extra) : extra;
  }
  return valor;
}

/** Cap. 5: cobertura sólida. Hasta 50 % → +3; más del 75 % → +6; si renuncia a atacar, el doble. */
export const COBERTURAS = { ninguna: 0, parcial: 3, fuerte: 6 };
export const bonoCobertura = (nivel, resguardado = false) => (COBERTURAS[nivel] ?? 0) * (resguardado ? 2 : 1);

/**
 * Daño fijo de un ataque (cap. 5): daño base del tipo + FUE/2 (sin armas), FUE (una mano), FUE × 1,5 (dos manos) o PER.
 * Un arma concreta puede fijar su propio `base` (campo danoBase de la ficha del arma).
 */
export function danoFijo({ edicion = EDICIONES.y3, tipo, config, atributo = 0, base = null }) {
  const b = base ?? (config.dano !== undefined ? config.dano : edicion.dano[tipo] ?? 0);
  const a = n(atributo);
  const mult = config.mult ? (config.mult === 1.5 ? edicion.multDosManos : config.mult) : 1;
  const bono = config.mitad ? suelo(a / 2) : mult !== 1 ? suelo(a * mult) : a;
  return n(b) + bono;
}

/** Dados que aporta apuntar (cap. 5): 1D6 por dado sacrificado en cuerpo a cuerpo, 2D6 a distancia. No explotan. */
export const dadosApuntar = (sacrificados, porDado = 1) => Math.max(0, n(sacrificados)) * n(porDado);

/**
 * Daño de un impacto. Crítico: el daño fijo se duplica (YayoSystem duplica también los dados) y en Ysystem3 ignora la armadura.
 * `extra`: dados ya tirados (proezas explosivas y apuntar). `armadura`: nivel de la protección del objetivo.
 */
export function danoImpacto({ fijo, extra = 0, critico = false, armadura = 0, edicion = EDICIONES.y3, dobla = "fijo" }) {
  const fijoFinal = critico ? n(fijo) * 2 : n(fijo);
  const extraFinal = critico && dobla === "todo" ? n(extra) * 2 : n(extra);
  const protege = critico && edicion.criticoIgnoraArmadura ? 0 : n(armadura);
  return Math.max(0, fijoFinal + extraFinal - protege);
}

/** Cap. 5: noquear = daño normal ÷ 2 (mínimo 1), tirada de Resistencia física con 1D menos. */
export const danoNoquear = danoNormal => Math.max(1, suelo(n(danoNormal) / 2));

/** Ráfagas (cap. 5): hasta 5 blancos, +2 de Agilidad a cada uno por blanco declarado; cargador vacío con 1-2 (ER: solo 1). */
export const rafagaVacia = (dado, edicion = EDICIONES.y3) => n(dado) <= edicion.rafaga.vaciaCon;

/** Explosivos (cap. 5): el daño baja con la distancia. */
export function danoExplosivo(rango, metros, edicion = EDICIONES.y3) {
  const e = edicion.explosivos.find(x => x.clave === rango) ?? edicion.explosivos[0];
  return Math.max(0, Math.round(e.dano - e.porMetro * Math.max(0, n(metros))));
}

/** Protecciones (cap. 6): armadura resta su nivel; penalización de la mitad redondeada abajo. Escudo suma a la Agilidad y penaliza todo su nivel. */
export const penalizacionArmadura = nivel => suelo(Math.max(0, n(nivel)) / 2);
export const penalizacionEscudo = nivel => Math.max(0, n(nivel));

/** ¿Afecta la penalización de las protecciones a esta habilidad? (Ysystem3: solo DES y FUE). */
export const penalizaHabilidad = (atributo, edicion = EDICIONES.y3) => edicion.protecciones === "todas" || ["des", "fue"].includes(atributo);

/**
 * Defensa activa de YayoSystem (no existe en el SRD de Ysystem3): IMSERSO 10 cuerpo a cuerpo y 15 con fuego,
 * +5 con crítico y +5 si apunta; Dungeons & Yayos depende del escudo.
 */
export function dificultadDefensa({ conjunto, fuego = false, distancia = false, critico = false, apuntado = false, escudo = false }) {
  if (conjunto === "dungeonsYayos") return distancia ? (escudo ? 15 : 20) : (escudo ? 10 : 15);
  return (fuego ? 15 : 10) + (critico ? 5 : 0) + (apuntado ? 5 : 0);
}

/** Electrochoque (cap. 5): 1 + PER/2 de daño; Fuerza bruta a 20 o incapacitado 3D minutos. */
export const danoElectrochoque = per => 1 + suelo(n(per) / 2);

/* ------------------------------------------------------------------ */
/* Otras fuentes de daño (cap. 5)                                     */
/* ------------------------------------------------------------------ */

export const aguanteRespiracion = fue => n(fue) + 5;
export function danoCaida(metros, edicion = EDICIONES.y3, rodando = false) {
  const m = n(metros);
  const bruto = m >= edicion.caida.desde ? m * edicion.caida.porMetro : 0;
  return Math.max(0, bruto - (rodando && bruto > 0 ? 3 : 0));
}
export const danoHambre = (horas, edicion = EDICIONES.y3) => suelo(n(horas) / edicion.hambreHoras);
export const danoSed = (horas, edicion = EDICIONES.y3) => suelo(n(horas) / edicion.sedHoras);
export const danoFrio = (minutos, edicion = EDICIONES.y3) => suelo(n(minutos) / edicion.congelacionMinutos);
export const danoBorrachera = dificultad => (dificultad >= 20 ? 3 : dificultad >= 15 ? 2 : 1);
export const BORRACHERAS = [{ valor: 10, etiqueta: "Leve (10)" }, { valor: 15, etiqueta: "Grave (15)" }, { valor: 20, etiqueta: "Bacanal (20)" }];

/** YayoSystem: caída 3 por metro, hambre/sed y borracheras con cifras propias (manual de IMSERSO, pp. 24-25). */
export const danoYayo = {
  caida: m => 3 * n(m),
  hambre: h => 2 * suelo(n(h) / 12),
  sed: h => 2 * suelo(n(h) / 6),
  cogorza: d => (d >= 20 ? 5 : d >= 15 ? 3 : 1)
};

/* ------------------------------------------------------------------ */
/* Pánico, Estabilidad y Resistencia mental (cap. 6)                  */
/* ------------------------------------------------------------------ */

/** Aplomo de un PJ frente a una tirada de pánico: +3 si está habituado por su profesión, +3 por proeza gastada. */
export const aplomoPanico = ({ aplomo: a, habituado = false, proezas = 0 }) => n(a) + (habituado ? 3 : 0) + refuerzoFijo(proezas);

/** Opcional del SRD: tras la primera tirada contra el mismo horror, la gravedad baja un nivel cada vez. */
export const gravedadHabituada = (gravedad, repeticiones) => Math.max(0, n(gravedad) - Math.max(0, n(repeticiones)));

/** Pérdida de Estabilidad = dados de la tirada (hack lovecraftiano: el doble). */
export const perdidaPanico = (dados, ampliado = false) => n(dados) * (ampliado ? 2 : 1);

/** Duración de una crisis de locura temporal según los puntos perdidos (cap. 6). */
export function duracionCrisis(perdida) {
  const p = n(perdida);
  if (p <= 3) return { dado: 1, unidad: "minutos" };
  if (p <= 5) return { dado: 1, unidad: "horas" };
  if (p === 6) return { dado: 1, unidad: "días" };
  return { dado: 1, unidad: "semanas" };
}

/** Opcional del SRD: críticos y pifias en Resistencia (dos o tres 6 / 1). */
export function resistenciaEspecial(caras) {
  const seises = caras.filter(c => c === 6).length;
  const unos = caras.filter(c => c === 1).length;
  if (seises >= 3) return "critico3";
  if (seises === 2) return "critico2";
  if (unos >= 3) return "pifia3";
  if (unos === 2) return "pifia2";
  return null;
}

/* ------------------------------------------------------------------ */
/* Curación (cap. 6)                                                  */
/* ------------------------------------------------------------------ */

/**
 * Fuentes de curación. `frecuencia`: «dia» (Salud cada día, Estabilidad cada tres), «sesion» (una vez por sesión),
 * «herida» (un intento por herida) o «dia3» (una vez cada tres días). `grupo`: las fuentes de un grupo no se acumulan.
 */
export function fuentesCuracion(edicion = EDICIONES.y3) {
  const c = edicion.curacion;
  const f = {
    hospital: { etiqueta: "Hospital o centro médico", frecuencia: "dia", grupo: "reposo", cantidad: c.hospital, aplica: ["salud", "estabilidad"] },
    reposo: { etiqueta: "Reposo confortable, sin estrés", frecuencia: "dia", grupo: "reposo", cantidad: c.reposo, aplica: ["salud", "estabilidad"] },
    auxilio: { etiqueta: "Auxilio a dificultad 10", frecuencia: "herida", cantidad: c.auxilio, critico: c.auxilioCritico, pifiaDano: c.auxilioPifia, habilidad: "auxilio", dificultad: 10, aplica: ["salud"] },
    dormir: { etiqueta: "Dormir más de ocho horas", frecuencia: "sesion", cantidad: c.dormir, aplica: ["salud", "estabilidad"] },
    contacto: { etiqueta: "Contacto físico prolongado", frecuencia: "sesion", cantidad: c.contacto, aplica: ["salud", "estabilidad"] }
  };
  if (c.psicologia) f.psicologia = { etiqueta: "Psicología a dificultad 10", frecuencia: "dia3", cantidad: c.psicologia, critico: 4, pifiaDano: 2, habilidad: "psicologia", dificultad: 10, aplica: ["estabilidad"] };
  if (c.relajante) f.relajante = { etiqueta: "Baño largo o actividad relajante", frecuencia: "sesion", cantidad: c.relajante, aplica: ["salud", "estabilidad"] };
  if (c.medicamentos) f.medicamentos = { etiqueta: "Medicamentos, ungüentos o hierbas", frecuencia: "dia", cantidad: c.medicamentos, aplica: ["salud", "estabilidad"] };
  if (c.apoyo) f.apoyo = { etiqueta: "Apoyo y cariño de otros personajes", frecuencia: "dia", cantidad: c.apoyo, aplica: ["salud", "estabilidad"], compatible: true };
  return f;
}

/** Curación de YayoSystem (manual de IMSERSO, p. 30). */
export const CURACION_IMSERSO = {
  hospital: { etiqueta: "Jornada en el hospital", frecuencia: "dia", grupo: "reposo", cantidad: 6, aplica: ["salud"] },
  casa: { etiqueta: "Jornada tranquila en casa u hotel", frecuencia: "dia", grupo: "reposo", cantidad: 3, aplica: ["salud"] },
  mesaCamilla: { etiqueta: "Tarde de cartas o mesa camilla", frecuencia: "dia", grupo: "reposo", cantidad: 2, aplica: ["salud"] },
  botiquin: { etiqueta: "Cura con botiquín (Ambulatorio 10)", frecuencia: "dia", cantidad: 2, critico: 4, habilidad: "auxilio", dificultad: 10, aplica: ["salud"] },
  siesta: { etiqueta: "Siesta reparadora (3 h)", frecuencia: "sesion", cantidad: 1, aplica: ["salud"] },
  masaje: { etiqueta: "Recibir un masaje", frecuencia: "sesion", cantidad: 1, aplica: ["salud"] },
  juegos: { etiqueta: "Bingo, cinquillo, mus o dominó", frecuencia: "sesion", cantidad: 1, aplica: ["salud"] }
};

/** ¿Se puede usar hoy esta fuente? `usadas` = { dia: [...], sesion: [...] }. */
export function curacionDisponible(fuentes, clave, usadas = {}) {
  const f = fuentes[clave];
  if (!f) return { ok: false, motivo: "Fuente desconocida." };
  const lista = usadas[f.frecuencia] ?? [];
  if (f.frecuencia !== "herida" && lista.includes(clave)) return { ok: false, motivo: f.frecuencia === "sesion" ? "Ya usada en esta sesión." : "Ya usada en este periodo." };
  const choca = f.grupo && Object.keys(fuentes).find(k => fuentes[k].grupo === f.grupo && (usadas.dia ?? []).includes(k));
  if (choca) return { ok: false, motivo: `No se acumula con «${fuentes[choca].etiqueta}».` };
  return { ok: true };
}

/** Recuperación automática por día: FUE +4/+6 → 1/2 de Salud; cada tres días, CAR +4/+6 → 1/2 de Estabilidad (cap. 6). */
export const recuperacionNatural = bono => (n(bono) >= 6 ? 2 : n(bono) >= 4 ? 1 : 0);

/** Hack «convalecencias más realistas»: la recuperación por día se divide por dos (hacia abajo, mínimo 1 si había algo). */
export const convalecencia = (cantidad, activa) => (activa && cantidad > 0 ? Math.max(1, suelo(cantidad / 2)) : cantidad);

/* ------------------------------------------------------------------ */
/* Persecuciones (cap. 6)                                             */
/* ------------------------------------------------------------------ */

/** Tabla de sucesos inesperados: tirada de 2D. */
export const SUCESOS = [
  { desde: 2, hasta: 2, clave: "oponente", titulo: "Oponente adicional inesperado", texto: "Ataque puntual de 3D contra la Agilidad del PJ; si impacta, 6 puntos de daño." },
  { desde: 3, hasta: 4, clave: "grave", titulo: "Obstáculo inesperado grave", dificultad: 16, texto: "Tirada extra de Atletismo o Conducir a dificultad 16. Fallar: pierde una distancia (accidente con pifia). Crítico: gana una." },
  { desde: 5, hasta: 6, clave: "medio", titulo: "Obstáculo inesperado de gravedad media", dificultad: 12, texto: "Tirada extra de Atletismo o Conducir a dificultad 12. Fallar: pierde una distancia (accidente con pifia). Crítico: gana una." },
  { desde: 7, hasta: 7, clave: "leve", titulo: "Obstáculo inesperado leve", dificultad: 8, texto: "Tirada extra de Atletismo o Conducir a dificultad 8. Fallar: pierde una distancia (accidente con pifia). Crítico: gana una." },
  { desde: 8, hasta: 9, clave: "ventaja1", titulo: "Ventaja menor", ventaja: "1", texto: "El PNJ de la persecución sufre un pequeño percance: su Agilidad baja 1 punto el turno siguiente." },
  { desde: 10, hasta: 11, clave: "ventaja2", titulo: "Ventaja mayor", ventaja: "1d6", texto: "El PNJ sufre un importante percance: su Agilidad baja 1D puntos el turno siguiente." },
  { desde: 12, hasta: 12, clave: "ventaja3", titulo: "Ventaja completa", ventaja: "2d6", texto: "El PNJ sufre un gran percance: su Agilidad baja 2D puntos el turno siguiente." }
];
export const sucesoDe = total => SUCESOS.find(s => total >= s.desde && total <= s.hasta);

/**
 * Persecución: el índice de distancia va de 0 (corta) a 3 (muy larga). El perseguidor captura por debajo de 0
 * y el perseguido huye por encima de 3. Un crítico mueve una distancia más.
 */
export function moverPersecucion({ distancia, perseguidor, exito, critico = false }) {
  const pasos = critico ? 2 : 1;
  const nueva = n(distancia) + (exito === perseguidor ? -pasos : pasos);
  return { distancia: Math.min(4, Math.max(-1, nueva)), fin: nueva < 0 ? "captura" : nueva > 3 ? "huida" : null };
}

/** Disparos durante una persecución: corta = normal; media = hay que apuntar 1D; larga/muy larga = solo con crítico. */
export function disparoEnPersecucion(distancia) {
  if (distancia <= 0) return { modo: "normal", apuntar: 0 };
  if (distancia === 1) return { modo: "apuntado", apuntar: 1 };
  return { modo: "solo-critico", apuntar: 0 };
}
/** Neumático: 1D a distancia corta, 2D a media, 3D a larga o más. */
export const apuntarNeumatico = distancia => Math.min(3, Math.max(0, n(distancia)) + 1);

/* ------------------------------------------------------------------ */
/* Magia y poderes (cap. 6)                                           */
/* ------------------------------------------------------------------ */

export const COSTE_PODER = { 8: 2, 12: 4, 16: 6 };
export const poderInicial = (dadosMagia, int, per) => 3 * n(dadosMagia) + n(int) + n(per) + 5;
export const costePoder = (dificultad, extra = 0) => (COSTE_PODER[dificultad] ?? 0) + n(extra);
/** Ocho horas de sueño recuperan todo; menos, la parte proporcional. */
export const recuperaPoder = (max, horas) => Math.min(n(max), suelo(n(max) * Math.min(1, n(horas) / 8)));

/* ------------------------------------------------------------------ */
/* Experiencia y aprendizaje (cap. 6)                                 */
/* ------------------------------------------------------------------ */

export const costeHabilidad = dadosActuales => (dadosActuales === 1 ? 5 : dadosActuales === 2 ? 10 : null);
export const costeAtributo = valorNuevo => 3 * n(valorNuevo);
/** Aprender de un maestro: 1D semanas (1→2D) o 1D meses (2→3D). */
export const tiempoAprendizaje = dadosActuales => (dadosActuales === 1 ? "semanas" : "meses");

/* ------------------------------------------------------------------ */
/* Creación de personajes (cap. 7)                                    */
/* ------------------------------------------------------------------ */

/**
 * Reparto legal de la creación libre: los bonificadores se usan una vez cada uno;
 * 4 habilidades a 3D y 8 a 2D (6 en YayoSystem). Devuelve cuentas y si está completo.
 */
export function repartoLibre(atributos, habilidades, conjunto = CONJUNTOS.srd) {
  const valores = Object.values(atributos).map(Number);
  const lista = Object.keys(conjunto.habilidades).map(k => n(habilidades[k]?.dados ?? habilidades[k], 1));
  const d3 = lista.filter(d => d === 3).length;
  const d2 = lista.filter(d => d === 2).length;
  const objetivo2 = conjunto.id === "srd" ? 8 : 6;
  const atributosOk = valores.length === Object.keys(conjunto.atributos).length
    && conjunto.bonificadores.every(b => valores.filter(v => v === b).length === 1);
  const idiomaOk = conjunto.id !== "srd" || n(habilidades.idiomaExtranjero2?.dados ?? habilidades.idiomaExtranjero2, 1) <= 1 || n(habilidades.idiomaExtranjero1?.dados ?? habilidades.idiomaExtranjero1, 1) >= 2;
  return { atributosOk, d3, d2, objetivo3: 4, objetivo2, idiomaOk, ok: atributosOk && idiomaOk && d3 === 4 && d2 === objetivo2 };
}

/* ------------------------------------------------------------------ */
/* Opcionales: tortura, duelos                                        */
/* ------------------------------------------------------------------ */

/** Tortura (cap. 6, opcional): dos tiradas contra el Aplomo. Fallar Conversación cuesta 1 de Salud; fallar Intimidación, 2. */
export function resolverTortura({ conversacion, intimidacion }) {
  const critico = conversacion.critico || intimidacion.critico;
  const perdida = (conversacion.exito ? 0 : 1) + (intimidacion.exito ? 0 : 2);
  const ambas = conversacion.exito && intimidacion.exito;
  return { automatico: critico, resistencia2D: ambas && !critico, perdida: critico ? 0 : perdida };
}

export const ESTADOS_DUELO = ["Derrotado", "Sobrepasado", "A la defensiva", "En guardia"];
export const estadoDuelo = ventaja => ESTADOS_DUELO[Math.max(0, Math.min(3, n(ventaja)))];

/* ------------------------------------------------------------------ */
/* Tabla de salvación ¡PULP! (Anexo Pulp)                             */
/* ------------------------------------------------------------------ */

export const TABLA_PULP = {
  3: "Mi hermano gemelo, cuya existencia ignoraba hasta ese momento.",
  4: "Algún artefacto, estructura o pieza de factura evidentemente alienígena.",
  5: "Alguien con quien contraje una terrible deuda (ahora le debo dos).",
  6: "Alguna tara personal, fobia o manía, que en este caso me ayuda.",
  7: "Una de mis pertenencias (elegida por el DJ o por el jugador, pero al azar).",
  8: "La persona o criatura que está más cerca de mí en este momento.",
  9: "Una planta que puedo ver con mis propios ojos.",
  10: "Un animal salvaje que hace acto de presencia de forma repentina.",
  11: "Un fenómeno atmosférico o físico inesperado.",
  12: "Una extraña y perturbadora premonición.",
  13: "Algo que leí una vez en cierto libro que cayó en mis manos.",
  14: "El más grave de mis dos defectos.",
  15: "Un consejo recibido en la más tierna infancia.",
  16: "Un viejo amigo que aparece de repente, esté yo donde esté.",
  17: "Un ser sobrenatural que acude en mi ayuda sin que yo sepa por qué.",
  18: "Un gorila."
};

/* ------------------------------------------------------------------ */
/* Automatismos y varios                                              */
/* ------------------------------------------------------------------ */

/** Normaliza un texto a clave de automatismo (sin tildes, minúsculas, con guiones). */
export const claveAutomatismo = texto =>
  String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Referencias de diseño de PNJ del anexo del cap. 7. */
export const REFERENCIAS_PNJ = {
  debil: { atributos: { car: 1, des: 2, fue: 2, int: 1, per: 3 }, nota: "PNJ oponente genérico débil" },
  fuerte: { atributos: { car: 2, des: 4, fue: 4, int: 2, per: 3 }, nota: "PNJ oponente genérico fuerte" },
  muyFuerte: { atributos: { car: 4, des: 6, fue: 6, int: 6, per: 4 }, nota: "PNJ oponente genérico muy fuerte" },
  antagonista: { atributos: { car: 6, des: 6, fue: 8, int: 6, per: 5 }, nota: "Gran antagonista" }
};
