import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../module/reglas.mjs";
import { CONJUNTOS, VARIANTES, REGLAS_OPCIONALES, CLAVES_HABILIDAD, tipoAtaque } from "../module/config.mjs";
import { TALENTOS_SRD } from "../module/talentos-data.mjs";
import { EFECTOS, clave } from "../module/talentos.mjs";

const Y3 = R.EDICIONES.y3;
const ER = R.EDICIONES.er;

test("valores fijos y derivados (SRD caps. 4-7)", () => {
  assert.equal(R.agilidad(2, 4), 10);            // 3 × 2D + DES
  assert.equal(R.aplomo(2, 6), 13);              // CAR + INT + 5
  assert.equal(R.perspicacia(6, 4), 15);         // INT + PER + 5
  assert.equal(R.resistenciaFisica(4), 8);
  assert.equal(R.resistenciaMental(6), 6);
  assert.equal(R.saludBase(4), 18);
  assert.equal(R.saludFija(4, true), 24);        // FUE × 2 + 16
  assert.equal(R.saludFija(4, false), 21);       // FUE × 2 + 13
  assert.equal(R.estabilidadBase(10), 15);
  assert.equal(R.proezasIniciales(6, 0), 6);     // los extremos: entre 3 y 8
  assert.equal(R.proezasIniciales(0, 0), 3);
  assert.equal(R.proezasIniciales(6, 6), 9 - 0);   // (6+6)/2+3 = 9 con atributos fuera del rango de PJ
  assert.equal(R.iniciativa(4, 6), 10);
  assert.equal(R.bemoles(4), 11);
});

test("ejemplos de PNJ del anexo del cap. 7 cuadran con las fórmulas", () => {
  const fuerte = { car: 2, des: 4, fue: 4, int: 2, per: 3 };
  assert.equal(R.agilidad(2, fuerte.des), 10);
  assert.equal(R.aplomo(fuerte.car, fuerte.int), 9);
  assert.equal(R.perspicacia(fuerte.int, fuerte.per), 10);
  assert.equal(R.resistenciaFisica(fuerte.fue), 8);
  const antag = { car: 6, des: 6, fue: 8, int: 6, per: 5 };
  assert.equal(R.agilidad(3, antag.des), 15);
  assert.equal(R.aplomo(antag.car, antag.int), 17);
  assert.equal(R.perspicacia(antag.int, antag.per), 16);
  assert.equal(R.resistenciaFisica(antag.fue), 4);
});

test("penalizador de Salud: bajo 11, 7 y 4", () => {
  assert.deepEqual([28, 11, 10, 7, 6, 4, 3, 1].map(v => R.penalizadorSalud(v)), [0, 0, 1, 1, 2, 2, 3, 3]);
});

test("críticos y pifias solo en habilidades; la repetición con proeza no da críticos", () => {
  assert.equal(R.evaluar({ caras: [6, 6, 1], dificultad: 25 }).critico, true);
  assert.equal(R.evaluar({ caras: [6, 6], dificultad: 25 }).exito, true);
  assert.equal(R.evaluar({ caras: [6, 6], dificultad: 25, sinCritico: true }).exito, false);
  assert.equal(R.evaluar({ caras: [6], dificultad: 25, critUnSeis: true }).critico, true);
  assert.equal(R.evaluar({ caras: [1], atributo: 6, dificultad: 5 }).exito, false);
  assert.equal(R.evaluar({ caras: [1, 1, 1], atributo: 6, dificultad: 5 }).pifia, true);
  assert.equal(R.evaluar({ caras: [], atributo: 6, dificultad: 5 }).pifia, false);
  for (const tipo of ["iniciativa", "panico", "resistenciaFisica", "resistenciaMental"]) {
    const r = R.evaluar({ caras: [6, 6], tipo, dificultad: 30 });
    assert.equal(r.critico, false, tipo);
    assert.equal(R.evaluar({ caras: [1, 1], tipo }).pifia, false, tipo);
  }
});

test("dados de la tirada: tope de 5D (solo Ysystem3), Recuerdo, proeza y defecto grave", () => {
  assert.equal(R.dadosDeTirada({ base: 3, proeza: true, recuerdo: true }), 5);
  assert.equal(R.dadosDeTirada({ base: 3, proeza: true, recuerdo: true, tope: Y3.topeDados }), 5);
  assert.equal(R.dadosDeTirada({ base: 3, proeza: true, recuerdo: true, tope: ER.topeDados }), 6);
  assert.equal(R.dadosDeTirada({ base: 3, defectoGrave: true }), 2);
  assert.equal(R.dadosDeTirada({ base: 1, penalizador: 3 }), 0);
  assert.equal(R.dadosDeTirada({ base: 3, sacrificados: 2, penalizador: 1 }), 0);
  assert.equal(R.dadosDeTirada({ base: 2, prestados: 1, recibidos: 1 }), 2);
});

test("acciones combinadas y Aplomo de grupo", () => {
  assert.equal(R.combinadas(3), 6);
  assert.equal(R.combinadas(9), 10);
  assert.equal(R.combinadas(4, { porColaborador: 4, maximo: 12 }), 12);
  assert.equal(R.aplomoDeGrupo([7, 10, 8]), 14);
  assert.equal(R.aplomoDeGrupo([9]), 9);
  assert.equal(R.aplomoDeGrupo(Array(9).fill(10)), 20);
});

test("oscuridad: lista y Ocultación distintas según la edición", () => {
  assert.equal(R.modificadorOscuridad("lucha", Y3), 5);
  assert.equal(R.modificadorOscuridad("lucha", ER), 0);
  assert.equal(R.modificadorOscuridad("psicologia", Y3), 5);
  assert.equal(R.modificadorOscuridad("ocultacion", Y3), -5);
  assert.equal(R.modificadorOscuridad("ocultacion", ER), 0);
  assert.equal(R.modificadorOscuridad("cultura", Y3), 0);
});

test("daño fijo: tabla del SRD (Ysystem3) y diferencias de la Edición Revisada", () => {
  const cfg = t => CONJUNTOS.srd.ataques[t];
  const d = (ed, t, a) => R.danoFijo({ edicion: ed, tipo: t, config: cfg(t), atributo: a });
  assert.equal(d(Y3, "desarmado", 5), 3);          // 1 + FUE/2
  assert.equal(d(Y3, "desarmadoEspecial", 4), 4);  // 2 + FUE/2
  assert.equal(d(Y3, "cuerpoUnaMano", 4), 7);      // 3 + FUE
  assert.equal(d(Y3, "cuerpoDosManos", 5), 10);    // 3 + FUE × 1,5 redondeado abajo
  assert.equal(d(Y3, "distancia", 2), 5);          // 3 + PER
  assert.equal(d(Y3, "fuegoCorto", 2), 9);
  assert.equal(d(Y3, "fuegoLargo", 2), 13);        // 11 + PER
  assert.equal(d(Y3, "fuegoLetal", 2), 17);
  assert.equal(d(ER, "fuegoLargo", 2), 12);        // ER: 10 + PER
  assert.equal(d(ER, "desarmadoEspecial", 4), 3);  // ER: no hay nivel intermedio
  assert.equal(d(ER, "cuerpoDosManos", 4), 7);     // ER: FUE íntegra
  assert.equal(R.danoFijo({ tipo: "cuerpoUnaMano", config: cfg("cuerpoUnaMano"), atributo: 2, base: 5 }), 7); // arma con danoBase propio
});

test("daño de un impacto: el crítico duplica el daño fijo e ignora la armadura (solo Ysystem3)", () => {
  assert.equal(R.danoImpacto({ fijo: 10, extra: 4, armadura: 3 }), 11);
  assert.equal(R.danoImpacto({ fijo: 10, extra: 4, armadura: 3, critico: true }), 24);
  assert.equal(R.danoImpacto({ fijo: 10, extra: 4, armadura: 3, critico: true, edicion: ER }), 21);
  assert.equal(R.danoImpacto({ fijo: 4, extra: 3, critico: true, dobla: "todo" }), 14);
  assert.equal(R.danoImpacto({ fijo: 2, armadura: 5 }), 0);
  assert.equal(R.danoNoquear(7), 3);
  assert.equal(R.danoNoquear(1), 1);
  assert.equal(R.dadosApuntar(2, 2), 4);
});

test("ráfagas, explosivos, cobertura y estados que modifican la Agilidad", () => {
  assert.equal(R.agilidadEfectiva({ base: 8, rafagaBlancos: 3 }), 14);                          // +6
  assert.equal(R.agilidadEfectiva({ base: 8, rafagaBlancos: 5, edicion: ER }), 18);              // ER: tope +10
  assert.equal(R.agilidadEfectiva({ base: 8, escudo: 3, refuerzos: 2 }), 17);
  assert.equal(R.agilidadEfectiva({ base: 9, sorprendido: true }), 4);
  assert.equal(R.agilidadEfectiva({ base: 10, inmovilizado: true, cobertura: 3 }), 8);
  assert.equal(R.bonoCobertura("parcial"), 3);
  assert.equal(R.bonoCobertura("fuerte", true), 12);
  assert.equal(R.rafagaVacia(2), true);
  assert.equal(R.rafagaVacia(2, ER), false);
  assert.equal(R.danoExplosivo("menor", 5), 15);     // 25 − 2 × 5
  assert.equal(R.danoExplosivo("mayor", 10), 95);    // 100 − 0,5 × 10
  assert.equal(R.danoExplosivo("menor", 5, ER), 10);
});

test("protecciones (cap. 6): ejemplo del SRD, armadura 5 + escudo 3", () => {
  assert.equal(R.penalizacionArmadura(5) + R.penalizacionEscudo(3), 5);
  assert.equal(R.penalizacionArmadura(1), 0);
  assert.equal(R.penalizaHabilidad("per", Y3), false);
  assert.equal(R.penalizaHabilidad("fue", Y3), true);
  assert.equal(R.penalizaHabilidad("per", ER), true);
});

test("otras fuentes de daño por edición", () => {
  assert.equal(R.danoCaida(1, Y3), 0);
  assert.equal(R.danoCaida(1, ER), 3);
  assert.equal(R.danoCaida(4, Y3), 12);
  assert.equal(R.danoCaida(4, Y3, true), 9);
  assert.equal(R.danoHambre(48, Y3), 2);
  assert.equal(R.danoHambre(48, ER), 4);
  assert.equal(R.danoFrio(60, Y3), 4);
  assert.equal(R.danoFrio(60, ER), 12);
  assert.equal(R.danoElectrochoque(5), 3);
  assert.equal(R.aguanteRespiracion(4), 9);
  assert.deepEqual([10, 15, 20].map(R.danoBorrachera), [1, 2, 3]);
});

test("umbrales de Salud: solo la primera vez y varios de golpe; Pulp ignora el primero", () => {
  assert.deepEqual(R.umbralesCruzados(18, 15, R.UMBRALES), [16]);
  assert.deepEqual(R.umbralesCruzados(18, 5, R.UMBRALES), [16, 11, 7]);
  assert.deepEqual(R.umbralesCruzados(18, 5, R.UMBRALES, { 16: true }), [11, 7]);
  assert.deepEqual(R.umbralesCruzados(16, 16, R.UMBRALES), []);
  assert.deepEqual(R.umbralesCruzados(4, 1, R.UMBRALES), [4, 2]);
  assert.deepEqual(R.umbralesPulp(R.UMBRALES), [11, 7, 4, 2]);
  assert.equal(R.proezasExtraPulp(5), 2);
  assert.equal(R.proezasExtraPulp(1), 0);
});

test("pánico: Aplomo con habituación y proezas, crisis y habituación al horror", () => {
  assert.equal(R.aplomoPanico({ aplomo: 10, habituado: true, proezas: 2 }), 19);
  assert.equal(R.gravedadHabituada(4, 1), 3);
  assert.equal(R.gravedadHabituada(1, 3), 0);
  assert.equal(R.perdidaPanico(3), 3);
  assert.equal(R.perdidaPanico(3, true), 6);
  assert.deepEqual([1, 3, 4, 5, 6, 7].map(p => R.duracionCrisis(p).unidad), ["minutos", "minutos", "horas", "horas", "días", "semanas"]);
  assert.equal(R.resistenciaEspecial([6, 6, 2]), "critico2");
  assert.equal(R.resistenciaEspecial([6, 6, 6]), "critico3");
  assert.equal(R.resistenciaEspecial([1, 1, 5]), "pifia2");
  assert.equal(R.resistenciaEspecial([1, 1, 1]), "pifia3");
  assert.equal(R.resistenciaEspecial([1, 3, 6]), null);
});

test("curación: cifras por edición, frecuencias y grupos que no se acumulan", () => {
  const f3 = R.fuentesCuracion(Y3);
  const fr = R.fuentesCuracion(ER);
  assert.equal(f3.hospital.cantidad, 2);
  assert.equal(fr.hospital.cantidad, 4);
  assert.ok(f3.psicologia && !fr.psicologia);
  assert.ok(fr.medicamentos && fr.apoyo && !f3.medicamentos);
  assert.equal(R.curacionDisponible(f3, "dormir", { sesion: ["dormir"] }).ok, false);
  assert.equal(R.curacionDisponible(f3, "contacto", { sesion: ["dormir"] }).ok, true);
  assert.equal(R.curacionDisponible(f3, "reposo", { dia: ["hospital"] }).ok, false);
  assert.equal(R.curacionDisponible(f3, "auxilio", { dia: ["hospital"] }).ok, true);
  assert.deepEqual([0, 1, 2, 4, 6].map(R.recuperacionNatural), [0, 0, 0, 1, 2]);
  assert.equal(R.convalecencia(2, true), 1);
  assert.equal(R.convalecencia(1, true), 1);
  assert.equal(R.convalecencia(3, false), 3);
});

test("persecuciones: distancias, capturas, huidas y tabla de sucesos de 2D", () => {
  assert.deepEqual(R.moverPersecucion({ distancia: 1, perseguidor: true, exito: true }), { distancia: 0, fin: null });
  assert.equal(R.moverPersecucion({ distancia: 0, perseguidor: true, exito: true }).fin, "captura");
  assert.equal(R.moverPersecucion({ distancia: 3, perseguidor: false, exito: true }).fin, "huida");
  assert.equal(R.moverPersecucion({ distancia: 1, perseguidor: false, exito: true, critico: true }).distancia, 3);
  assert.equal(R.moverPersecucion({ distancia: 1, perseguidor: true, exito: false }).distancia, 2);
  for (let t = 2; t <= 12; t++) assert.ok(R.sucesoDe(t), `suceso ${t}`);
  assert.equal(R.sucesoDe(2).clave, "oponente");
  assert.equal(R.sucesoDe(4).dificultad, 16);
  assert.equal(R.sucesoDe(12).clave, "ventaja3");
  assert.equal(R.disparoEnPersecucion(1).apuntar, 1);
  assert.equal(R.disparoEnPersecucion(3).modo, "solo-critico");
});

test("magia y poder, experiencia y aprendizaje", () => {
  assert.equal(R.poderInicial(2, 4, 2), 17);
  assert.equal(R.costePoder(12), 4);
  assert.equal(R.recuperaPoder(20, 4), 10);
  assert.equal(R.costeHabilidad(1), 5);
  assert.equal(R.costeHabilidad(2), 10);
  assert.equal(R.costeHabilidad(3), null);
  assert.equal(R.costeAtributo(3), 9);
});

test("creación libre: bonificadores sin repetir, 4 habilidades a 3D y 8 a 2D", () => {
  const habs = d3 => {
    const h = Object.fromEntries(Object.keys(CONJUNTOS.srd.habilidades).map(k => [k, { dados: 1 }]));
    Object.keys(h).slice(0, 4).forEach(k => { h[k].dados = 3; });
    Object.keys(h).slice(4, 4 + d3).forEach(k => { h[k].dados = 2; });
    return h;
  };
  const atr = { car: 0, des: 1, fue: 2, int: 4, per: 6 };
  assert.equal(R.repartoLibre(atr, habs(8)).ok, true);
  assert.equal(R.repartoLibre(atr, habs(7)).ok, false);
  assert.equal(R.repartoLibre({ ...atr, car: 1 }, habs(8)).atributosOk, false);
  const y = CONJUNTOS.imserso;
  const hy = Object.fromEntries(Object.keys(y.habilidades).map(k => [k, { dados: 1 }]));
  Object.keys(hy).slice(0, 4).forEach(k => { hy[k].dados = 3; });
  Object.keys(hy).slice(4, 10).forEach(k => { hy[k].dados = 2; });
  assert.equal(R.repartoLibre({ int: 0, car: 2, des: 4, fue: 6 }, hy, y).ok, true);
});

test("idioma extranjero II exige 2D o 3D en el I", () => {
  assert.equal(R.idiomaDisponible(1, "idiomaExtranjero2"), false);
  assert.equal(R.idiomaDisponible(2, "idiomaExtranjero2"), true);
  assert.equal(R.idiomaDisponible(1, "cultura"), true);
});

test("tortura opcional y duelos", () => {
  const ok = { exito: true, critico: false }, ko = { exito: false, critico: false };
  assert.deepEqual(R.resolverTortura({ conversacion: ok, intimidacion: ok }), { automatico: false, resistencia2D: true, perdida: 0 });
  assert.equal(R.resolverTortura({ conversacion: ko, intimidacion: ko }).perdida, 3);
  assert.equal(R.resolverTortura({ conversacion: ko, intimidacion: ok }).perdida, 1);
  assert.equal(R.resolverTortura({ conversacion: { exito: true, critico: true }, intimidacion: ko }).automatico, true);
  assert.equal(R.estadoDuelo(3), "En guardia");
  assert.equal(R.estadoDuelo(0), "Derrotado");
});

test("tabla de salvación ¡PULP!: 3 a 18 completas", () => {
  for (let t = 3; t <= 18; t++) assert.ok(R.TABLA_PULP[t], `casilla ${t}`);
  assert.equal(R.TABLA_PULP[18], "Un gorila.");
});

test("desempate de iniciativa: DES, INT, PER, Agilidad y edad", () => {
  const a = R.desempateIniciativa({ des: 4, int: 1 });
  const b = R.desempateIniciativa({ des: 3, int: 6 });
  const c = R.desempateIniciativa({ des: 4, int: 2 });
  const d = R.desempateIniciativa({ des: 4, int: 2, per: 1 });
  const joven = R.desempateIniciativa({ des: 4, int: 2, per: 1, agil: 5, edad: 20 });
  const viejo = R.desempateIniciativa({ des: 4, int: 2, per: 1, agil: 5, edad: 70 });
  assert.ok(a > b && c > a && d > c && joven > viejo);
});

test("configuración: variantes y reglas opcionales apuntan a cosas que existen", () => {
  for (const [clave, v] of Object.entries(VARIANTES)) {
    assert.ok(CONJUNTOS[v.conjunto], `${clave}: conjunto`);
    for (const r of v.reglas) assert.ok(REGLAS_OPCIONALES[r], `${clave}: regla ${r}`);
  }
  for (const c of Object.values(CONJUNTOS)) {
    for (const [k, h] of Object.entries(c.habilidades)) {
      assert.ok(CLAVES_HABILIDAD.includes(k), `${c.id}: habilidad ${k}`);
      assert.ok(c.atributos[h.atributo], `${c.id}.${k}: atributo ${h.atributo}`);
    }
    for (const a of Object.values(c.ataques)) assert.ok(c.habilidades[a.habilidad], `${c.id}: ataque con habilidad ${a.habilidad}`);
  }
  assert.equal(Object.keys(CONJUNTOS.srd.habilidades).length, 24);
  assert.equal(Object.keys(CONJUNTOS.imserso.habilidades).length, 20);
  assert.equal(tipoAtaque("fuegoLargo", CONJUNTOS.imserso), "fuegoGrande");
  assert.equal(tipoAtaque("cuerpoLigera", CONJUNTOS.srd), "cuerpoUnaMano");
});

test("habilidades del SRD: 24 en total (el SRD dice «ocho de INT», pero la lista tiene siete: erratum)", () => {
  const cuenta = Object.values(CONJUNTOS.srd.habilidades).reduce((a, h) => ({ ...a, [h.atributo]: (a[h.atributo] ?? 0) + 1 }), {});
  assert.deepEqual(cuenta, { des: 5, int: 7, car: 4, fue: 1, per: 7 });
});

test("talentos: 64 del SRD y los efectos apuntan a talentos que existen", () => {
  assert.equal(TALENTOS_SRD.length, 64);
  const nombres = new Set(TALENTOS_SRD.map(t => clave(t.nombre)));
  const faltan = Object.keys(EFECTOS).filter(k => !nombres.has(k));
  // Alias ortográficos conocidos (con y sin tilde) que no existen como talento aparte.
  assert.deepEqual(faltan.filter(k => !["nadie-se-lo-esperaria-de-ti", "puntería-mortifera"].includes(k)), []);
});

test("las dos ediciones difieren donde el SRD lo anuncia", () => {
  assert.equal(Y3.topeDados, 5);
  assert.equal(ER.topeDados, Infinity);
  assert.equal(Y3.profesionPNJ, true);
  assert.equal(ER.profesionPNJ, false);
  assert.equal(Y3.puntoGuion, true);
  assert.equal(ER.puntoGuion, false);
  assert.equal(Y3.explosivos.length, 3);
  assert.equal(ER.explosivos.length, 2);
});
