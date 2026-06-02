const IMG = "systems/ysystem3-srd/assets/ysystem-icon.png";

function skills({ d3 = [], d2 = [] } = {}) {
  const out = {};
  for (const key of d3) out[key] = { dados: 3 };
  for (const key of d2) if (!out[key]) out[key] = { dados: 2 };
  return out;
}

function pj({ name, raza, edad, profesion, alineamiento, attrs, salud, jamacuco, yayos, arquetipo, talento, defectos, familia, pertenencias, hechizos, d3, d2 }) {
  return {
    name,
    type: "personaje",
    img: IMG,
    system: {
      datos: {
        jugador: "",
        lugarNacimiento: `${raza} · ${alineamiento}`,
        edad: String(edad),
        profesion,
        perfil: "Dungeons & Yayos",
        motivacion: "Buscar el secreto de la eterna juventud en una mazmorra que no promete nada bueno.",
        descripcionFisica: arquetipo,
        situacionFamiliar: familia,
        arquetipo,
        talento,
        pertenencias,
        historia: hechizos
      },
      atributos: attrs,
      habilidades: skills({ d3, d2 }),
      salud: { valor: salud, max: salud },
      resistenciaFisica: { valor: jamacuco, primeraTirada: false, umbrales: { 16: false, 11: false, 7: false, 4: false, 2: false } },
      estabilidad: { valor: 18, max: 18 },
      resistenciaMental: { valor: 12, primeraTirada: false, umbrales: { 16: false, 11: false, 7: false, 4: false, 2: false } },
      proezas: { valor: yayos, inicial: yayos },
      defectos,
      recuerdo: { usado: false, nota: "" },
      puntoGuion: { valor: 1, max: 1, usado: false, nota: "" },
      combate: { armaIniciativa: "desarmado", ataque: "desarmado", sorprendido: false },
      estado: { inconsciente: false, crisisMental: false, muerto: false, notas: "" }
    }
  };
}

function item(type, name, system) {
  return { name, type, img: IMG, system };
}

export const DUNGEONS_YAYOS_PACKS = [
  {
    name: "dungeons-yayos-reglas",
    label: "Reglas Dungeons & Yayos",
    documentName: "JournalEntry",
    data: [
      {
        name: "Reglas para Forgotten Pills",
        pages: [{
          name: "Resumen operativo",
          type: "text",
          text: {
            format: 1,
            content: `
              <h2>Dungeons & Yayos</h2>
              <p>Variante de YayoSystem para fantasia heroica parodica en Forgotten Pills. El Sr. Ministro pasa a ser el <strong>Dungeon Minister</strong> y los PJ son aventureros talluditos.</p>
              <h3>Atributos y valores</h3>
              <p>La ficha usa <strong>CAC</strong> (Cacumen), <strong>GRA</strong> (Gracia), <strong>PRE</strong> (Prestancia) y <strong>ROB</strong> (Robustez). En el sistema se guardan internamente como INT, CAR, DES y FUE para conservar compatibilidad.</p>
              <p><strong>Bemoles</strong>: (CAC + ROB) / 2 + 2. <strong>Nervio</strong>: CAC + GRA + 5. <strong>Jamacuco</strong> sustituye a Resistencia fisica. El recurso de proezas se llama <strong>Yayopoints</strong>.</p>
              <h3>Habilidades</h3>
              <p>Se usa la lista propia: Atletismo, Lanzamiento, Robar, Batallitas, Magia Potagia, Salero, Cerrojos y Trampas, Medicina, Sapiencia, Cosas del Campo, Memoria, Silbido, Cotilleo, Mula Parda, Tollinas, Discusion, Nietos, Vista, Ingesta y Oido.</p>
              <h3>Combate</h3>
              <p>La iniciativa no aplica modificadores por arma. No hay armas de fuego. Las armas y hechizos ofensivos causan un dano fijo propio y suman ROB.</p>
              <p>La defensa activa en Dungeons & Yayos usa Atletismo: dificultad 10 contra ataques sin armas o cuerpo a cuerpo si se usa escudo; dificultad 15 contra esos ataques sin escudo o contra proyectiles con escudo; dificultad 20 contra proyectiles sin escudo.</p>
              <h3>Magia Potagia</h3>
              <p>Solo puede usarse con 2D o 3D en la habilidad. Cada aventurero puede intentar tantos hechizos al dia como sus dados en Magia Potagia + CAC. La dificultad depende del hechizo, de Bemoles o de Nervio del objetivo.</p>`
          }
        }]
      }
    ]
  },
  {
    name: "dungeons-yayos-hechizos",
    label: "Hechizos Dungeons & Yayos",
    documentName: "Item",
    data: [
      item("poder", "Curacion Pis Pas", { tipo: "Hechizo", habilidad: "magiaPotagia", atributo: "int", dificultad: 12, preparacion: "1 minuto", lanzamiento: "", duracion: "Instantaneo", caducidad: "", equipado: false, descripcion: "Permite recuperar 3 puntos de Salud, o 5 con critico. La pifia no cura y obliga al receptor a tirar por Jamacuco. Puede lanzarse sobre uno mismo." }),
      item("poder", "Moradito Ven a Mi", { tipo: "Hechizo", habilidad: "magiaPotagia", atributo: "int", dificultad: 13, preparacion: "5 minutos", lanzamiento: "", duracion: "Instantaneo", caducidad: "", equipado: false, descripcion: "Otorga la bendicion de Moradito y hace ganar 1 yayopoint." }),
      item("poder", "Zombi Irse Ya", { tipo: "Hechizo", habilidad: "magiaPotagia", atributo: "int", dificultad: 12, preparacion: "1 turno completo", lanzamiento: "Al comienzo del siguiente turno", duracion: "Instantaneo", caducidad: "", equipado: false, descripcion: "Expulsa no-muertos en un radio de 10 metros. Ajusta la dificultad a Bemoles de cada no-muerto +3." }),
      item("poder", "Charleta Animal", { tipo: "Hechizo", habilidad: "magiaPotagia", atributo: "int", dificultad: 10, preparacion: "Instantaneo", lanzamiento: "", duracion: "Conversacion", caducidad: "", equipado: false, descripcion: "Permite hablar con animales. Dificultad 10 para mamiferos, 12 para aves, 14 para reptiles y 16 para el resto." }),
      item("poder", "Gui Ar de Champions", { tipo: "Hechizo", habilidad: "magiaPotagia", atributo: "int", dificultad: 10, preparacion: "Cancion improvisada", lanzamiento: "Cada turno activo", duracion: "Mantenido", caducidad: "", equipado: false, descripcion: "Enaltece a aliados en 10 metros y les da +3 a todas sus tiradas. La dificultad empieza en 10 y sube +1 acumulativo cada turno." }),
      item("poder", "Boloncio Fogoso", { tipo: "Hechizo ofensivo", habilidad: "magiaPotagia", atributo: "int", dificultad: 12, preparacion: "Final de turno", lanzamiento: "", duracion: "Hasta extinguirse", caducidad: "", equipado: false, descripcion: "Prende fuego al objetivo. Dificultad igual al Nervio del objetivo. Hace perder 3 Salud por turno hasta que se extinga." }),
      item("poder", "Colleja Nosferatu", { tipo: "Hechizo ofensivo", habilidad: "magiaPotagia", atributo: "int", dificultad: 12, preparacion: "Cualquier momento", lanzamiento: "Debe tocar a la victima", duracion: "Instantaneo", caducidad: "", equipado: false, descripcion: "Dificultad igual al Nervio del objetivo. La victima pierde 1D6 Salud y el mago recupera esa cantidad." }),
      item("poder", "Quieto Parao", { tipo: "Hechizo", habilidad: "magiaPotagia", atributo: "int", dificultad: 12, preparacion: "Final de turno", lanzamiento: "", duracion: "1 minuto", caducidad: "", equipado: false, descripcion: "Dificultad igual a Bemoles de cada objetivo. Reduce la velocidad a la mitad e impide defenderse activamente. Mula Parda DF 15 permite librarse al final de cada turno." }),
      item("poder", "Vision en el Tonegro", { tipo: "Hechizo", habilidad: "magiaPotagia", atributo: "int", dificultad: 12, preparacion: "1 minuto", lanzamiento: "", duracion: "8 horas", caducidad: "", equipado: false, descripcion: "Dificultad igual a Bemoles del objetivo. Permite ver en la oscuridad como si fuera de dia." }),
      item("poder", "Zurrapa de Lomo Magica", { tipo: "Hechizo", habilidad: "magiaPotagia", atributo: "int", dificultad: 15, preparacion: "1 turno completo", lanzamiento: "", duracion: "10 minutos", caducidad: "", equipado: false, descripcion: "Cubre un circulo de 5 metros con zurrapa resbaladiza. Quien atraviese el area debe superar Atletismo DF 15 o caer, con -5 a sus acciones hasta salir." })
    ]
  },
  {
    name: "dungeons-yayos-armas",
    label: "Armas Dungeons & Yayos",
    documentName: "Item",
    data: [
      item("arma", "Espadon a dos manos que da mucho acojone", { tipo: "cuerpoDosManos", habilidad: "tollinas", danoBase: 9, atributoDano: "fue", iniciativa: 0, equipado: false, descripcion: "Arma enorme de barbaro. Dano 9 + ROB." }),
      item("arma", "Navajita platea", { tipo: "cuerpoUnaMano", habilidad: "tollinas", danoBase: 6, atributoDano: "fue", iniciativa: 0, equipado: false, descripcion: "Navaja pequena y traicionera. Dano 6 + ROB." }),
      item("arma", "Martillo grandote", { tipo: "cuerpoDosManos", habilidad: "tollinas", danoBase: 7, atributoDano: "fue", iniciativa: 0, equipado: false, descripcion: "Martillo contundente de clerigo enano. Dano 7 + ROB." }),
      item("arma", "Abanicos de combate", { tipo: "cuerpoUnaMano", habilidad: "tollinas", danoBase: 5, atributoDano: "fue", iniciativa: 0, equipado: false, descripcion: "Permiten atacar con ambas manos en cada turno si el Dungeon Minister lo autoriza. Dano 5 + ROB." }),
      item("arma", "Arco elfico tallado con primor", { tipo: "distancia", habilidad: "lanzamiento", danoBase: 7, atributoDano: "fue", iniciativa: 0, equipado: false, descripcion: "Arco con carcaj magico que no se gasta. Dano 7 + ROB." }),
      item("arma", "Arco-baston", { tipo: "distancia", habilidad: "lanzamiento", danoBase: 6, atributoDano: "fue", iniciativa: 0, equipado: false, descripcion: "Sirve tanto a distancia como en cuerpo a cuerpo. Dano 6 + ROB." }),
      item("arma", "Cayado de madera de boj", { tipo: "cuerpoUnaMano", habilidad: "tollinas", danoBase: 5, atributoDano: "fue", iniciativa: 0, equipado: false, descripcion: "Cayado de mago con dignidad relativa. Dano 5 + ROB." })
    ]
  },
  {
    name: "dungeons-yayos-protecciones",
    label: "Protecciones Dungeons & Yayos",
    documentName: "Item",
    data: [
      item("armadura", "Armadura tocha enana", { nivel: 5, penalizador: 2, equipado: false, automatismo: "", descripcion: "Reduce 5 puntos de dano de cualquier ataque salvo ataques magicos o con fuego." }),
      item("armadura", "Sosten de escama de hierro", { nivel: 3, penalizador: 1, equipado: false, automatismo: "", descripcion: "Reduce 3 puntos de dano de cualquier ataque salvo ataques magicos o con fuego." }),
      item("escudo", "Escudo de aventurero talludito", { nivel: 1, penalizador: 1, equipado: false, automatismo: "", descripcion: "Permite mejorar la defensa activa segun las reglas de Dungeons & Yayos." })
    ]
  },
  {
    name: "dungeons-yayos-pj",
    label: "PJ pregenerados Dungeons & Yayos",
    documentName: "Actor",
    data: [
      pj({ name: "Xhangra Poko", raza: "Humano", edad: 78, profesion: "Guerrero", alineamiento: "Neutral brutote", attrs: { int: 0, car: 2, des: 4, fue: 6 }, salud: 13, jamacuco: 7, yayos: 6, arquetipo: "Barbaro revientacraneos", talento: "Furia homicida", defectos: { leve: "A veces su cerebro desconecta y se queda en Babia.", grave: "Desdentado.", leveUsado: false }, familia: "Multiples reclamaciones de paternidad y abuelidad han terminado por arruinarlo.", pertenencias: "Taparrabos cimerio, espadon a dos manos (dano 9+ROB), cuchillo para pelar manzanas (dano 3+ROB), muslo de pollo, 5 monedas de cobre.", hechizos: "", d3: ["tollinas", "mulaParda", "ingesta"], d2: ["atletismo", "lanzamiento", "batallitas", "silbido"] }),
      pj({ name: "Láralai de Lókomir", raza: "Elfo de la floresta florida", edad: 7548, profesion: "Explorador", alineamiento: "Neutral remilgado", attrs: { int: 6, car: 0, des: 4, fue: 2 }, salud: 13, jamacuco: 13, yayos: 10, arquetipo: "Elfo delicado", talento: "Bomba de cafeina natural", defectos: { leve: "Cagalera cronica.", grave: "Artritis elfoide.", leveUsado: false }, familia: "Vivio milenios con su tia abuela Gertrudisflindel y ahora se siente desarraigado.", pertenencias: "Ropas elficas de comando, abanicos de combate (dano 5+ROB), arco elfico (dano 7+ROB), carcaj magico, 102 monedas de cobre.", hechizos: "", d3: ["atletismo", "lanzamiento", "vista"], d2: ["cosasCampo", "oido", "robar", "tollinas"] }),
      pj({ name: "Reginalda Bajovientre", raza: "Mediana", edad: 98, profesion: "Ladrona", alineamiento: "Neutral mangui", attrs: { int: 2, car: 4, des: 6, fue: 0 }, salud: 15, jamacuco: 9, yayos: 12, arquetipo: "Mediana piesparaqueosquiero", talento: "Hostiaca inesperada", defectos: { leve: "Tiene las unas de los pinreles bastante retorcidas.", grave: "Digestiones pesadas.", leveUsado: false }, familia: "Siete hijos, dieciocho hijas, sesenta y tres nietos y un gato Ragdoll.", pertenencias: "Bandolera, bota de vino, chorizo, queso, cuerda, alicates, linterna sordomuda, navajita platea (dano 6+ROB), 14 monedas de cobre.", hechizos: "", d3: ["robar", "cerrojosTrampas", "atletismo"], d2: ["cotilleo", "tollinas", "vista", "nietos"] }),
      pj({ name: "Kurita Ke-kura", raza: "Enano", edad: 347, profesion: "Clerigo", alineamiento: "Legal enrollao", attrs: { int: 6, car: 0, des: 2, fue: 4 }, salud: 18, jamacuco: 13, yayos: 8, arquetipo: "Enano cascarrabias", talento: "Dones enanos", defectos: { leve: "Suelta pequenos escupitajos cuando habla.", grave: "Ya no cuida tanto la trenza de su barba y se le engancha en todos lados.", leveUsado: false }, familia: "Entro temprano en el seminario de Moradito y recuerda a su vieja novia Guendolin.", pertenencias: "Armadura tocha (-5 dano), casco de hojalata, martillo grandote (dano 7+ROB), escudo, botas con alza, 47 monedas de cobre.", hechizos: "Curacion Pis Pas; Moradito Ven a Mi; Zombi Irse Ya.", d3: ["magiaPotagia", "medicina", "sapiencia"], d2: ["tollinas", "mulaParda", "oido", "memoria"] }),
      pj({ name: "Vili Ailis", raza: "Humana", edad: 81, profesion: "Barda", alineamiento: "Caotica lenguaraz", attrs: { int: 0, car: 6, des: 4, fue: 2 }, salud: 10, jamacuco: 7, yayos: 10, arquetipo: "Barda frustrada", talento: "Temazo motivador", defectos: { leve: "Pechuga extreme que dificulta la movilidad.", grave: "Dolor cronico de espalda.", leveUsado: false }, familia: "Cuatro hijos y muchos nietos vigorosos y vocingleros a los que cuidar 24/7.", pertenencias: "Tunica verde, sosten de escama de hierro (-3 dano), ukelele, arco-baston (dano 6+ROB), carcaj con 20 flechas, 17 monedas de cobre.", hechizos: "Charleta Animal; Gui Ar de Champions.", d3: ["salero", "cotilleo", "magiaPotagia"], d2: ["lanzamiento", "atletismo", "discusion", "nietos"] }),
      pj({ name: "Guoter Jiting", raza: "Semielfo", edad: 173, profesion: "Mago", alineamiento: "Neutral fachilla", attrs: { int: 6, car: 0, des: 4, fue: 2 }, salud: 7, jamacuco: 13, yayos: 10, arquetipo: "Mago con infulas de sabio", talento: "Sabelotodo", defectos: { leve: "Barriga cervecera de tacto petreo.", grave: "Durillo de oido.", leveUsado: false }, familia: "Su familia lo manda a hacer recados para que no moleste, aunque sus nietos adoran sus trucos.", pertenencias: "Amplios ropajes blancos, chistera, baraja espanola, bolsito de hierbas, cayado de boj (dano 5+ROB), 38 monedas de cobre.", hechizos: "Boloncio Fogoso; Colleja Nosferatu; Quieto Parao; Vision en el Tonegro; Zurrapa de Lomo Magica.", d3: ["magiaPotagia", "sapiencia", "memoria"], d2: ["vista", "oido", "tollinas", "salero"] })
    ]
  }
];
