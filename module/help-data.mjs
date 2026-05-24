export const SHEET_HELP = {
  attribute: {
    car: { title: "Carisma", subtitle: "CAR", body: "Sociabilidad, persuasion, intimidacion, seduccion y presencia." },
    des: { title: "Destreza", subtitle: "DES", body: "Rapidez, sigilo, maña, reflejos y equilibrio." },
    fue: { title: "Fuerza", subtitle: "FUE", body: "Vigor fisico, constitucion, empuje y resistencia corporal." },
    int: { title: "Inteligencia", subtitle: "INT", body: "Razonamiento, cultura, memoria, tecnica y conocimientos." },
    per: { title: "Percepcion", subtitle: "PER", body: "Sentidos, punteria, atencion y lectura del entorno." }
  },
  skill: {
    atletismo: { title: "Atletismo", subtitle: "DES", body: "Correr, nadar, saltar, trepar, bailar y competir fisicamente.", details: ["Suele oponerse a Agilidad."] },
    auxilio: { title: "Auxilio", subtitle: "INT", body: "Primeros auxilios, diagnosticos, tratamientos y cuidados." },
    conducir: { title: "Conducir", subtitle: "DES", body: "Guiar monturas, vehiculos o naves con eficacia.", details: ["En persecuciones suele oponerse a Agilidad."] },
    conversacion: { title: "Conversacion", subtitle: "CAR", body: "Debatir, negociar, obtener informacion honesta e imponer puntos de vista.", details: ["Suele oponerse a Aplomo."] },
    cultura: { title: "Cultura", subtitle: "INT", body: "Saberes generales no cubiertos por entorno o idiomas." },
    entorno: { title: "Entorno", subtitle: "PER", body: "Datos del entorno fisico y humano habitual del personaje." },
    fuerzaBruta: { title: "Fuerza bruta", subtitle: "FUE", body: "Romper, levantar, empujar, forzar y resistir fisicamente.", details: ["Suele oponerse a Agilidad cuando hay competencia fisica."] },
    idiomaExtranjero1: { title: "Idioma extranjero I", subtitle: "INT", body: "Leer, escribir y comunicarse en una lengua distinta de la materna." },
    idiomaExtranjero2: { title: "Idioma extranjero II", subtitle: "INT", body: "Segundo idioma. Requiere competencia suficiente en el primero durante la creacion." },
    informacion: { title: "Informacion", subtitle: "INT", body: "Buscar datos en libros, redes, archivos, pantallas o documentos." },
    intimidacion: { title: "Intimidacion", subtitle: "CAR", body: "Presionar mediante amenazas o presencia.", details: ["Suele oponerse a Aplomo."] },
    lucha: { title: "Lucha", subtitle: "DES", body: "Combate desarmado y armas cuerpo a cuerpo.", details: ["En combate se opone a Agilidad."] },
    mecanica: { title: "Mecanica", subtitle: "INT", body: "Abrir, reparar, sabotear o manipular maquinas y mecanismos." },
    memoria: { title: "Memoria", subtitle: "INT", body: "Recordar caras, nombres, lugares, datos y referencias." },
    observacion: { title: "Observacion", subtitle: "PER", body: "Registrar, buscar y descubrir detalles ocultos.", details: ["Puede oponerse a Agilidad cuando se detecta a alguien escondido."] },
    ocultacion: { title: "Ocultacion", subtitle: "DES", body: "Esconder objetos o esconderse.", details: ["Suele oponerse a Perspicacia."] },
    oido: { title: "Oido", subtitle: "PER", body: "Escuchar conversaciones, ruidos y fuentes sonoras.", details: ["Puede oponerse a Agilidad."] },
    psicologia: { title: "Psicologia", subtitle: "PER", body: "Interpretar intenciones y estado emocional.", details: ["Suele oponerse a Aplomo."] },
    punteria: { title: "Punteria", subtitle: "PER", body: "Lanzar, disparar y apuntar.", details: ["En combate se opone a Agilidad."] },
    rastreo: { title: "Rastreo", subtitle: "PER", body: "Seguir huellas, marcas, rastros y evidencias de paso." },
    seduccion: { title: "Seduccion", subtitle: "CAR", body: "Atraer, caer bien y conseguir favores por magnetismo.", details: ["Suele oponerse a Aplomo."] },
    sigilo: { title: "Sigilo", subtitle: "DES", body: "Moverse sin hacer ruido.", details: ["Suele oponerse a Perspicacia."] },
    simulacion: { title: "Simulacion", subtitle: "CAR", body: "Mentir, disfrazarse, sonsacar y pasar desapercibido socialmente.", details: ["Suele oponerse a Perspicacia."] },
    supervivencia: { title: "Supervivencia", subtitle: "PER", body: "Refugio, alimento, agua y recursos en espacios hostiles." }
  },
  rule: {
    proezas: { title: "Proezas (SRD)", body: "Representan el empuje heroico del PJ. Al inicio de sesion se calculan como la mitad redondeada hacia abajo de FUE + INT, +3. Pueden gastarse para repetir dados de una tirada fallada, anadir 1D antes de tirar, mejorar temporalmente Agilidad/Aplomo/Perspicacia, aumentar dano o cancelar un critico enemigo.", details: ["No se puede superar 5D en una tirada de habilidad.", "El +1D por proeza es incompatible con Recuerdo cuando... en la misma tirada."] },
    agilidad: { title: "Agilidad", body: "Valor fijo y pasivo para resistir ataques, persecuciones y maniobras fisicas contra el personaje. Se calcula con 3 x dados de Atletismo + DES. En Ysystem3 evita tirar por el PNJ: el PJ tira contra este valor cuando corresponde." },
    aplomo: { title: "Aplomo", body: "Valor fijo y pasivo para resistir presion social, intimidacion, seduccion, miedo y situaciones que ponen a prueba la entereza. Se calcula con CAR + INT + 5 y tambien sirve de base para Estabilidad." },
    perspicacia: { title: "Perspicacia", body: "Valor fijo y pasivo para detectar enganos, ocultacion, sigilo y detalles relevantes cuando alguien actua contra el personaje. Se calcula con INT + PER + 5." },
    salud: { title: "Salud", body: "Mide la capacidad de resistir dano fisico. La Salud inicial se calcula con FUE x 2 + 10 + 1D6. Al bajar de ciertos umbrales se aplican penalizadores a las tiradas y pueden activarse tiradas de Resistencia fisica.", details: ["11 o menos: -1D.", "7 o menos: -2D.", "4 o menos: -3D.", "0 Salud: muerte salvo regla o tono de mesa que indique otra cosa."] },
    estabilidad: { title: "Estabilidad", body: "Mide la resistencia mental ante panico, horror, trauma o presion extrema. Se calcula con Aplomo + 5 + 1D6. Al cruzar umbrales se tiran pruebas de Resistencia mental; a 0 se produce una ruptura o locura permanente segun la escena." },
    resistenciaFisica: { title: "Resistencia fisica", body: "Valor objetivo para comprobar si el personaje se mantiene consciente al cruzar umbrales de Salud. Se calcula como 12 - FUE. La tirada se hace normalmente con 3D sin sumar atributo; si falla, el PJ cae inconsciente." },
    resistenciaMental: { title: "Resistencia mental", body: "Valor objetivo para comprobar si el personaje aguanta mentalmente al cruzar umbrales de Estabilidad. Se calcula como 12 - CAR. La tirada se hace normalmente con 3D; si falla, sufre una crisis temporal." },
    defectos: { title: "Defectos", body: "Los defectos permiten al DJ complicar una tirada cuando encajan con la ficcion. Un defecto grave obliga a repetir con -1D y el PJ gana 1 proeza. Un defecto leve permite forzar una repeticion una vez por sesion, sin dar proeza." },
    puntoGuion: { title: "Punto de guion", body: "Recurso narrativo para introducir un elemento, ventaja, contacto, detalle o giro razonable en la historia con aprobacion del DJ. No mejora directamente una tirada como una proeza: modifica la situacion narrativa. Normalmente se recupera al comienzo de una aventura o cuando el tono de campana lo permita." },
    ataque: { title: "Ataque (SRD)", body: "Los ataques se resuelven con Lucha o Punteria contra la Agilidad del objetivo. El dano depende del arma y normalmente suma el atributo indicado. Un critico duplica el dano e ignora armadura; una pifia puede dejar vendido al atacante o provocar una complicacion.", details: ["Las tiradas de habilidad nunca superan 5D.", "Las protecciones pueden reducir dano o aumentar la dificultad defensiva, segun sean armadura o escudo."] },
    danoReglado: { title: "Daño reglado", body: "Atajos para resolver fuentes de dano no procedentes de un ataque ordinario: caidas, asfixia, venenos, hambre, sed, quemaduras, sobreesfuerzos y riesgos ambientales. Ajusta la cantidad y automatismo segun la situacion de juego." },
    empeoramiento: { title: "Aprendizaje", body: "Ysystem3 permite adaptar la evolucion de los PJ al tono de la ambientacion. Usa este control para registrar cambios de atributo o deterioros pactados tras la aventura, especialmente en campanas donde la experiencia no solo mejora al personaje." }
  },
  section: {
    datos: { title: "Datos", body: "Identidad, perfil, profesion y motivacion del PJ." },
    arquetipos: { title: "Talentos", body: "Rasgos, talentos o notas mecanicas propias de la ambientacion." },
    pertenencias: { title: "Pertenencias", body: "Equipo, armas y talentos arrastrables." }
  }
};

export function helpEntry(type, key) {
  return SHEET_HELP[type]?.[key] ?? null;
}
