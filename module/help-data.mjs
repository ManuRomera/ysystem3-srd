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
    proezas: { title: "Proezas (SRD)", body: "Inicio de sesion: floor((FUE+INT)/2)+3. Repetir dados, +1D en habilidad, buff a valores fijos, +D de dano en combate o anular critico enemigo." },
    agilidad: { title: "Agilidad", body: "3 x dados de Atletismo + bonus DES. Dificultad de ataques y acciones fisicas en oposicion." },
    aplomo: { title: "Aplomo", body: "Bonus CAR + bonus INT + 5. Cordura, oposicion social y tiradas de miedo." },
    perspicacia: { title: "Perspicacia", body: "Bonus INT + bonus PER + 5. Detectar enganos, ocultacion y sigilo." },
    salud: { title: "Salud", body: "Bonus FUE x 2 + 10 + 1D6. Penalizadores: -1D (<11), -2D (<7), -3D (<4). A 0 muere." },
    estabilidad: { title: "Estabilidad", body: "Aplomo + 5 + 1D6. A 0: locura permanente. Umbrales de Resistencia mental en 16, 11, 7, 4 y 2." },
    resistenciaFisica: { title: "Resistencia fisica", body: "12 - bonus FUE. Tirada de 3D (sin atributo) al cruzar umbrales de Salud; fallo = inconsciencia." },
    resistenciaMental: { title: "Resistencia mental", body: "12 - bonus CAR. Tirada de 3D al cruzar umbrales de Estabilidad; fallo = crisis temporal." },
    defectos: { title: "Defectos", body: "Grave: repetir con -1D y ganas 1 proeza. Leve: repetir 1 vez por sesion. El DJ obliga a repetir la tirada." },
    puntoGuion: { title: "Punto de guion", body: "Recurso narrativo de Ysystem3 para introducir una ventaja, elemento o giro pactado con el DJ. Normalmente se recupera por aventura o sesion segun el tono de mesa." },
    ataque: { title: "Ataque (SRD)", body: "Lucha/Punteria vs Agilidad. Dano segun tipo de arma (ver reglas). Critico x2 e ignora armadura. Maximo 5D en tiradas de habilidad." },
    danoReglado: { title: "Daño reglado", body: "Automatiza caidas, asfixia, venenos, hambre, sed, quemaduras y sobreesfuerzos." },
    empeoramiento: { title: "Aprendizaje", body: "YSYSTEM puede adaptarse por ambientacion. Usa este control para registrar cambios de atributo tras aventura si procede." }
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
