# Auditoría de Ysystem3 SRD (0.3.22 → 1.0.0)

Fecha: 2026-10-04. Fuentes de reglas contrastadas:

- **SRD de Ysystem3** (los 8 capítulos, versión web de 2026, CC BY 4.0): <https://walhallaediciones.gitlab.io/ysystem/srd/>.
- **Ysystem Edición Revisada** (2023), manual local «Ysystem Edición Revisada – Pergaminos de Midgard»: reglas (págs. 8-38) y hacks (págs. 56-66).
- **IMSERSO to the limit**, *Manual Imserso FINAL* (pp. 8-41).
- **Dungeons & Yayos**: sin fuente disponible (ver §5).

## 1. Las «versiones» y qué cambia

El reglamento tiene dos ediciones vigentes con cifras distintas, y el sistema 0.3.22 solo conocía una (mezclada con IMSERSO). La 1.0.0 las aplica según un ajuste de mundo (`module/reglas.mjs → EDICIONES`, con tests):

| Regla | Ysystem3 (SRD 2026) | Edición Revisada (2023) |
|---|---|---|
| Tope de dados | 5D | sin tope |
| +3 de profesión | PJ y PNJ | solo PJ |
| Punto de guion | sí | no |
| Oscuridad (+5 dif.) | 12 habilidades; Ocultación −5 | 9 habilidades; sin Ocultación |
| Desarmado especial / dos manos | 2 + FUE/2 · FUE × 1,5 | no existen (1 + FUE/2 · FUE) |
| Arma de fuego larga | 11 + PER | 10 + PER |
| Crítico en ataque | daño fijo ×2 e ignora armadura | daño ×2; la armadura cuenta |
| Ráfagas | cargador vacío con 1-2; el daño suma PER | vacío con 1; el daño no suma PER; tope +10 de Agilidad |
| Explosivos | 25 / 50 / 100 | 20 / 40 |
| Protecciones | penalizan DES y FUE | penalizan todo |
| Caída · frío · hambre | 3/m desde 2 m · 15 min · 24 h | 3/m desde 1 m · 5 min · 12 h |
| Curación | hospital 2, reposo 1, Auxilio 2, Psicología 2 | hospital 4, reposo 2, medicamentos 1-2, apoyo +1, Auxilio 2 |
| Defecto sobre un crítico | lo anula | no se puede |

Las **ambientaciones** son de tres clases: **(a)** *conjuntos de reglas* distintos (IMSERSO, Dungeons & Yayos: 4 atributos 0/+2/+4/+6, 20 habilidades, Nervio/Bemoles, Jamacuco, defensa activa, cifras de daño propias); **(b)** *Anexo Pulp* (ignora el umbral 16, +1D con proeza en Resistencias, proezas extra de sesión, tabla de salvación); **(c)** *géneros* (fantasía, ciencia ficción, lovecraftiano, capa y espada, ciberpunk, terror) que ahora activan los «hacks» que el libro recomienda para ellos (pánico ampliado, duelos, superpuntería, tortura, noquear, soltar la cita) y la magia o psiónica.

Erratum del SRD: el capítulo 4 dice que hay «ocho habilidades de INT»; la lista tiene siete (7 INT + 7 PER + 5 DES + 4 CAR + 1 FUE = 24). El sistema sigue la lista.

## 2. Fallos de la 0.3.22 y qué se hizo

La 0.3.22 era una copia del sistema IMSERSO v1 con un maquillaje del SRD: heredaba reglas que no son de Ysystem3.

| # | Fallo | Gravedad | En 1.0.0 |
|---|---|---|---|
| 1 | **Los defectos eran casillas que marca el jugador antes de tirar** (−1D y +1 proeza). El SRD: los activa el DJ sobre una tirada ya sacada (también un crítico). Se podían fabricar proezas | Alta | Botones solo para el DJ en la tarjeta; se retira la proeza del crítico anulado |
| 2 | **Los umbrales de Salud/Estabilidad nunca se reiniciaban**: pasada la primera sesión, ya no saltaba ninguna tirada de Resistencia. Tampoco había «nueva sesión» (proezas iniciales, defecto leve, Recuerdo) | Alta | Nueva sesión, nuevo día y nueva aventura (ficha y Panel del DJ) |
| 3 | **Defensa activa y «inconsciente a 1 de Salud»** son reglas de IMSERSO, no del SRD | Alta | Solo en IMSERSO/Dungeons & Yayos; en el SRD se usa «Defenderse completamente» (+1D de Agilidad, sube en iniciativa) |
| 4 | **Dungeons & Yayos con los valores cruzados**: el hueco «Agilidad» calculaba Bemoles (CAC+7) y el de «Aplomo», Nervio; los ataques se tiraban contra Bemoles | Alta | Nervio (3×Gimnasia+PRE) para lo físico y Bemoles (CAC+7) para lo social, como en el manual de IMSERSO |
| 5 | **IMSERSO con los umbrales corridos un punto** (15-10-6-3-1 con «baja de») y con las cifras de daño del SRD (1/3/7/11/15) en lugar de las suyas (2/4/7/10); oposiciones erróneas (Mula parda, Nietos, Sus labores, Silbido) | Alta | Umbrales 16-11-7-4-2, daños 2/4/7/10, iniciativa PRE+arma y oposiciones del manual |
| 6 | Crítico en ataque: duplicaba también los dados explosivos y los de apuntar | Media | Solo el daño fijo (Ysystem3) |
| 7 | Pánico incompleto: sin +3 por profesión, sin proezas para reforzar el Aplomo, sin habituación, sin duración de la crisis, sin pánico de PNJ de 2D; «Estabilidad inicial = CAR+INT+16» fija en las plantillas | Media | Tarjeta de pánico completa y Estabilidad = Aplomo + 5 + 1D |
| 8 | Sin ráfagas, noquear, inmovilizar, zafarse, huir, cobertura, explosivos, electrochoque ni ataques combinados (se trataban como dados extra, no +2) | Media | Implementados (ver §3) |
| 9 | Iniciativa a mano: sin desempate, el «6» solo escribía un mensaje, el sorprendido recibía −999 | Media | `Combatant` propio con desempate DES→INT→PER→Agilidad→edad y acción extra para uno solo |
| 10 | Sin Experiencia, aprendizaje, puntos de Poder ni habilidad de Magia/Psiónica; los poderes tiraban Cultura | Media | Experiencia y «Mejorar», Poder, Magia/Psiónica |
| 11 | Anexo Pulp a medias (solo el umbral 16): sin proezas de sesión, sin +1D en Resistencia, sin la tabla de salvación | Media | Completo |
| 12 | Sin +3 de profesión para PNJ, sin umbrales de Resistencia para PNJ (el SRD: «todo personaje»), los PNJ mostraban las 24 habilidades en vez de 4 | Media | Corregido |
| 13 | Tirada de Resistencia fallida marcaba «inconsciente» sin revertirlo si una proeza repetía con éxito | Media | Se revierte |
| 14 | Otras fuentes de daño: caída `(m−2)×3`, hambre y sed sin distinguir edición, sin electrochoque/frío/asfixia por turnos | Media | Según edición y con tirada |
| 15 | Tope de 5D aplicado antes de restar penalizadores y sin avisar | Baja | Se muestra «Tope de 5D» |
| 16 | **Compendio de reglas copiado del PDF de pago** (con ejemplos del libro); PJ y PNJ de la aventura comercial «Sangre en el agua»; armas con nombres de esa aventura | Alta (legal) | Compendio generado desde el SRD público (CC BY 4.0, con atribución); PJ/PNJ de aventura sustituidos por los 4 PNJ del anexo del SRD |
| 17 | Descripciones erróneas: armadura de placas «penalizador −2D» (es −2 puntos) | Baja | Corregido; armas y protecciones regeneradas de la tabla del SRD |
| 18 | Armas de compendio con el daño de una sola edición | Baja | `danoBase` estándar = «el de la tabla de la edición» |
| 19 | Hojas, diálogos y creador en **V1** (`Dialog`, `Application`, `renderChatMessage`, `{async:true}`): obsoleto en 13 y roto en 14. Manifiesto con `minimum 11` y `maximum 13` aunque el código exigía 13 | Alta | ApplicationV2 + DataModels + `compat.mjs`; mínimo 13, sin máximo |
| 20 | Instalación desde `main`; ZIP con archivos de desarrollo; compendios LevelDB versionados (ruido en cada commit) y **sembrados en caliente** en compendios de mundo | Media | Release por etiqueta, `packs/` compilados desde `module/contenido.mjs` |
| 21 | Etiquetas sin tilde («Conversacion», «Percepcion»), sin tests, sin CI, CHANGELOG y README desfasados | Baja | Corregido; pruebas, `npm run check`, CI |
| 22 | La variante «base» llamaba `game.imserso`, clases `Imserso*`, CSS `ims-*`: deuda de nombres | Baja | Nombres propios; los antiguos (`game.ysystem`, `game.ysystem3Srd`, `game.imserso`) siguen como alias |
| 23 | Sin memoria de ventanas, accesibilidad, encuadre del retrato; iconos de ventana en riesgo | Media | Mixins de memoria, accesibilidad y retrato; CSS sin `font-family` sobre botones/iconos |

## 3. Cobertura de automatismos

✅ automatizado · 🟡 la herramienta ayuda y decide la mesa · ⬜ no automatizable

| Regla (capítulo) | Estado | Cómo |
|---|---|---|
| Tirada: dados + atributo, +3 profesión, tope 5D, dificultad con el token marcado (3) | ✅ | Diálogo con avisos del cálculo |
| Críticos (2+ seises) y pifias; sin ellos en Iniciativa, Resistencias y pánico (3) | ✅ | |
| Oscuridad (+5; Ocultación −5) (3) | ✅ | Casilla del diálogo; lista según edición |
| Valores fijos Agilidad/Aplomo/Perspicacia, refuerzo +3 por proeza, sorpresa e inmovilización a la mitad (3-5) | ✅ | Con chips de efectos temporales; caducan al cambiar de asalto |
| Oposición automática contra el valor fijo del objetivo (4) | ✅ | |
| Proezas: repetir dados (sin crítico), +1D previo, +3 a valor fijo, +1D explosivo al daño (máx. 2/3), crítico en contra a fallo (3) | ✅ | |
| Proezas ganadas: defecto grave, crítico (3) | ✅ | Crítico: ajuste de mundo |
| Proezas ganadas: buena interpretación, la cita (3) | 🟡 | Botones del Panel del DJ (decide el DJ) |
| Sobrantes al terminar la sesión (3) | ✅ | Nueva sesión |
| Recuerdo cuando… (3) | ✅ | +2D, incompatible con +1D de proeza; sesión/aventura; «Vidas pasadas» |
| Defectos grave y leve (3) | ✅ | Botones del DJ; leve una vez por sesión |
| Punto de guion (3) | 🟡 | Gasta el punto y avisa; la creación del recurso es narrativa |
| Acciones combinadas y ayudar (3) | ✅ | +2 por colaborador (+10 máx.), dados prestados/recibidos |
| Combinar PNJ contra Conversación/Intimidación (4) | 🟡 | `aplomoDeGrupo` en el motor; el DJ introduce el número de PNJ |
| Iniciativa, 6 = acción extra, sorpresa, desempate (5) | ✅ | Tracker con distintivos |
| Atacar: daño por tipo, apuntar, noquear, ráfagas, cobertura, desenfundar, ataques combinados, crítico (5) | ✅ | Diálogo único; daño pendiente de aplicar |
| Defenderse completamente, inmovilizar, zafarse, huir (5) | ✅ / 🟡 | Las tres primeras tiran; «huir» avisa del ataque de oportunidad |
| Explosivos con atenuación por distancia (5) | 🟡 | Cifras por edición en `reglas.mjs`; el DJ aplica el daño con «Salud → otra cantidad» |
| Otras fuentes de daño (5) | ✅ | Diálogo por fuente |
| Salud, penalizadores, Resistencia física y umbrales (5) | ✅ | Tarjeta de umbrales, un botón por umbral |
| Protecciones (6) | ✅ | Armadura resta daño; escudo suma Agilidad; penalizaciones según edición |
| Tortura (6, opcional) | ✅ | Panel del DJ |
| Pánico, Estabilidad, Resistencia mental, crisis (6) | ✅ | Tarjeta de pánico; duración de la crisis; habituación; pánico de PNJ de 2D |
| Críticos y pifias de Resistencia (6, opcional) | ✅ | Ajuste de mundo |
| Curación (6) | ✅ | Fuentes diarias, cada tres días, por sesión y por herida; recuperación natural FUE/CAR +4/+6 en «nuevo día» |
| Persecuciones, distancias, accidentes, tabla de sucesos de 2D, disparos por distancia (6) | ✅ | Tarjeta de persecución |
| Magia y poderes (6) | ✅ | Habilidad Magia/Psiónica, Poder, costes 2/4/6, oposición al valor fijo, sueño |
| Aprendizaje y Experiencia (6) | ✅ / ⬜ | XP y «Mejorar» automáticos; el maestro y el tiempo de aprendizaje, narrativos |
| Creación libre y plantillas, reparto legal (7) | ✅ | Asistente con validación |
| PNJ: cuatro habilidades, referencias del anexo, Salud sin dados (7) | ✅ | |
| Talentos del SRD (7) | 🟡 | ~30 con efecto mecánico (dados, críticos con un 6, repeticiones gratis, daño…); el resto gasta su uso y avisa |
| Anexo Pulp (8) | ✅ | |
| Hacks del libro: noquear, convalecencias, PJ que no mueren, soltar la cita, pánico ampliado, duelos, superpuntería | ✅ / 🟡 | Ajustes de mundo; superpuntería (segundo blanco) y duelos con ayuda parcial |

Pendiente de automatizar (consciente): atenuación de explosivos por distancia en un solo clic, superpuntería (segundo blanco), seguimiento por turnos de la asfixia, y los talentos puramente narrativos.

## 4. Diseño, uso y espacio

- Ficha de PJ en una sola columna que se adapta al ancho: vitales (Salud, Estabilidad) a la vista, proezas y los cinco valores fijos en una sola fila, recursos de sesión como interruptores y cuatro pestañas (Habilidades, Combate, Equipo, Personaje; DJ para el GM). Las 24 habilidades se reparten en columnas por atributo sin huecos.
- **Modo compacto** (340 px de ancho) y **candado de edición**; las ventanas recuerdan posición, tamaño, pestaña y modo por usuario.
- Diálogos de dos columnas (menos de la mitad de alto que los de la 0.3.22), tarjetas de chat con estado (los botones desaparecen al resolverse) y un tema por ambientación, claro y oscuro.
- Accesibilidad: icono en la cabecera de todas las ventanas (tamaño de texto, alto contraste, fuente legible, reducir movimiento, ayuda inmediata) y encuadre del retrato.
- Comprobado en Foundry 13.351: carga sin errores, 14 compendios, ficha de PJ y PNJ, objeto, asistente, panel del DJ, tiradas, repetición con proeza, daño con umbrales, pánico y cambio de las diez ambientaciones y de edición.

## 5. Pendiente y preguntas para Manu

1. **Dungeons & Yayos**: no hay manual local (es una aventura de pago de *¡Vamos que nos vamos!*). Las fórmulas se han alineado con el manual de IMSERSO y con la propia documentación del sistema, pero no se han podido verificar; sus compendios (hechizos, armas, PJ pregenerados) vienen del suplemento y se mantienen por compatibilidad. ¿Tienes el PDF para auditarlo, o prefieres retirar esos compendios del paquete público?
2. **Módulos satélite** `ysystem3-cuervos` e `ysystem3-imserso` (en `Data/modules`): usan hooks V1 (`renderActorSheet`, `renderApplication`, `renderChatMessage`) que ya no se disparan con las hojas V2. Siguen leyendo las mismas rutas `system.*`, pero su interfaz necesita adaptarse (misma receta que `imserso-to-the-limit`).
3. **IMSERSO dentro de este sistema**: existe el sistema dedicado «MR- IMSERSO to the limit» (arquetipos, trajes, Sr. Ministro). Aquí solo está su núcleo de reglas. Recomendación: mantenerlo como compatibilidad y señalar el sistema dedicado.
4. **Foundry 14**: la capa `compat.mjs` está preparada, pero no hay una instalación 14 con la que probarlo.
5. **Prueba con varios jugadores**: los botones de las tarjetas respetan permisos y usan el socket del sistema para que un jugador resuelva su daño; conviene probarlo con dos usuarios reales.
