/**
 * Modelos de datos. Sin template.json: cada tipo declara su esquema aquí.
 * Las rutas (system.datos.*, system.atributos.*, system.resistenciaFisica.umbrales.*…) son las de las
 * versiones 0.x a propósito: los mundos existentes y los módulos satélite escriben en ellas.
 */
import { CLAVES_ATAQUE, CLAVES_ATRIBUTO, CLAVES_HABILIDAD } from "./config.mjs";
import { UMBRALES } from "./reglas.mjs";

const { StringField, NumberField, BooleanField, SchemaField, ArrayField, ObjectField } = foundry.data.fields;

const texto = (initial = "") => new StringField({ required: true, blank: true, initial });
const entero = (initial = 0, min, max) => new NumberField({ required: true, nullable: false, integer: true, initial, min, max });
const si = (initial = false) => new BooleanField({ required: true, initial });

const atributos = (initial = {}) => new SchemaField(Object.fromEntries(CLAVES_ATRIBUTO.map(k => [k, entero(initial[k] ?? 0)])));
const habilidades = () => new SchemaField(Object.fromEntries(CLAVES_HABILIDAD.map(k => [k, new SchemaField({ dados: entero(1, 1, 3) })])));
const par = (valor, max) => new SchemaField({ valor: entero(valor), max: entero(max) });
const umbrales = () => new SchemaField(Object.fromEntries(UMBRALES.map(u => [u, si()])));
const resistencia = valor => new SchemaField({ valor: entero(valor), primeraTirada: si(), umbrales: umbrales() });
const manual = valor => new SchemaField({ valor: entero(valor), manual: si() });
const poder = () => new SchemaField({ valor: entero(0, 0), max: entero(0, 0), dados: entero(1, 0, 3) });

/** Dados de combate comunes a PJ y PNJ: lo que caduca con el asalto o la escena. */
const combateComun = () => ({
  sorprendido: si(), accionExtra: si(), inmovilizado: si(),
  defensaCompleta: entero(0, 0),            // resultado del 1D de «Defenderse completamente» (suma a la Agilidad un turno)
  refuerzoAgilidad: entero(0, 0), refuerzoAplomo: entero(0, 0), refuerzoPerspicacia: entero(0, 0),
  cobertura: new StringField({ required: true, blank: false, initial: "ninguna", choices: ["ninguna", "parcial", "fuerte"] }),
  resguardado: si(), ignoraPenalizador: si()   // «Retroceder nunca, rendirse jamás»: sin penalizador de Salud el resto del combate
});

/** Datos antiguos: habilidades como número suelto, vacíos o con dados fuera de 1-3; números guardados como texto vacío. */
function normalizar(datos) {
  const hab = datos.habilidades;
  if (hab && typeof hab === "object") {
    for (const [k, v] of Object.entries(hab)) {
      const d = Number(v?.dados ?? v);
      hab[k] = { dados: Math.min(3, Math.max(1, Number.isFinite(d) ? d : 1)) };
    }
  }
  const numero = (obj, clave) => {
    if (!obj || !(clave in obj)) return;
    const v = obj[clave];
    if (v === "" || v === null || !Number.isFinite(Number(v))) delete obj[clave];
    else obj[clave] = Number(v);
  };
  for (const parte of ["salud", "estabilidad"]) { numero(datos[parte], "valor"); numero(datos[parte], "max"); }
  for (const parte of ["resistenciaFisica", "resistenciaMental"]) numero(datos[parte], "valor");
  for (const parte of ["proezas"]) { numero(datos[parte], "valor"); numero(datos[parte], "inicial"); }
  for (const parte of ["puntoGuion"]) { numero(datos[parte], "valor"); numero(datos[parte], "max"); }
  for (const parte of ["agilidad", "aplomo", "perspicacia"]) if (datos[parte] && typeof datos[parte] === "object") numero(datos[parte], "valor");
  return datos;
}

export class PersonajeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      datos: new SchemaField({
        jugador: texto(), lugarNacimiento: texto(), edad: texto(), profesion: texto(), perfil: texto(), motivacion: texto(),
        descripcionFisica: texto(), situacionFamiliar: texto(), arquetipo: texto(), talento: texto(), talentoExplicacion: texto(),
        historia: texto(), pertenencias: texto(), relaciones: texto(), cita: texto()
      }),
      atributos: atributos({ car: 0, des: 1, fue: 2, int: 4, per: 6 }),
      habilidades: habilidades(),
      salud: par(18, 18),
      resistenciaFisica: resistencia(10),
      estabilidad: par(18, 18),
      resistenciaMental: resistencia(12),
      proezas: new SchemaField({ valor: entero(4, 0), inicial: entero(4, 0) }),
      defectos: new SchemaField({ grave: texto(), leve: texto(), leveUsado: si() }),
      recuerdo: new SchemaField({ usado: si(), nota: texto(), usos: entero(0, 0) }),
      puntoGuion: new SchemaField({ valor: entero(1, 0), max: entero(1, 0), usado: si(), nota: texto() }),
      combate: new SchemaField({
        armaIniciativa: texto("desarmado"), ataque: texto("desarmado"), ...combateComun()
      }),
      estado: new SchemaField({ inconsciente: si(), crisisMental: si(), muerto: si(), fueraDeJuego: si(), notas: texto() }),
      experiencia: new SchemaField({ total: entero(0, 0), gastada: entero(0, 0) }),
      poder: poder(),
      pulp: new SchemaField({ salvacionUsada: si() }),
      curaciones: new SchemaField({ dia: new ArrayField(texto()), dia3: new ArrayField(texto()), sesion: new ArrayField(texto()) }),
      valoresManual: new ObjectField(),
      usosTalentos: new ObjectField()
    };
  }

  static migrateData(datos) {
    return super.migrateData(normalizar(datos));
  }
}

export class PnjData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      descripcion: texto(), bando: texto(), rol: texto(),
      atributos: atributos(),
      habilidades: habilidades(),
      salud: par(10, 10),
      agilidad: manual(3), aplomo: manual(7), perspicacia: manual(7),
      resistenciaFisica: new SchemaField({ valor: entero(12), manual: si(), umbrales: umbrales() }),
      ataque: new SchemaField({
        nombre: texto("Ataque desarmado"), habilidad: texto("lucha"),
        tipo: new StringField({ required: true, blank: false, initial: "desarmado", choices: CLAVES_ATAQUE }),
        dano: entero(0, 0)
      }),
      combate: new SchemaField(combateComun()),
      estado: new SchemaField({ inconsciente: si(), muerto: si(), notas: texto() }),
      poder: poder(),
      notas: texto()
    };
  }

  static migrateData(datos) {
    return super.migrateData(normalizar(datos));
  }
}

/** Campos comunes de los objetos que se pueden usar. */
const uso = () => ({
  descripcion: texto(), equipado: si(), automatismo: texto(), habilidadUso: texto(), dificultadUso: entero(9, 0)
});

export class EquipoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { ...uso(), cantidad: entero(1, 0), uso: texto(), categoria: texto(), modificadores: new ObjectField() };
  }
}

export class ArmaData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      tipo: new StringField({ required: true, blank: false, initial: "desarmado", choices: CLAVES_ATAQUE }),
      habilidad: texto("lucha"), danoBase: entero(1, 0), atributoDano: texto("fue"), iniciativa: entero(0),
      descripcion: texto(), equipado: si(), automatismo: texto(), alcance: texto()
    };
  }
}

export class ProteccionData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { descripcion: texto(), nivel: entero(1, 0, 10), penalizador: entero(0, 0), equipado: si(), automatismo: texto() };
  }
}

export class PoderData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      descripcion: texto(), tipo: texto(), habilidad: texto("cultura"), atributo: texto("int"), dificultad: entero(8, 1),
      preparacion: texto(), lanzamiento: texto(), duracion: texto(), caducidad: texto(), costeExtra: entero(0, 0),
      contra: new StringField({ required: true, blank: true, initial: "", choices: ["agilidad", "aplomo", "perspicacia"] }),
      equipado: si(), automatismo: texto()
    };
  }
}

export class TalentoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { ...uso(), usos: par(1, 1), categoria: texto(), frecuencia: new StringField({ required: true, blank: true, initial: "" }) };
  }
}

export class ArquetipoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      arquetipoKey: texto(), genero: texto(), perfil: texto(),
      atributos: new ObjectField(), habilidades: new ObjectField(),
      habilidades3d: new ArrayField(texto()), habilidades2d: new ArrayField(texto()),
      proezas: entero(0, 0), saludBase: entero(0, 0), resistenciaFisica: entero(0, 0), resistenciaMental: entero(0, 0),
      talentoNombre: texto(), talento: texto(), descripcion: texto()
    };
  }
}

export const MODELOS_ACTOR = { personaje: PersonajeData, pnj: PnjData };
export const MODELOS_ITEM = {
  equipo: EquipoData, objeto: EquipoData, arma: ArmaData, armadura: ProteccionData, escudo: ProteccionData,
  poder: PoderData, talento: TalentoData, arquetipo: ArquetipoData
};
