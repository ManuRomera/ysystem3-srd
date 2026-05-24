# Historial de cambios — YSYSTEM3 SRD para Foundry VTT

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue la convención [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).
El versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.3.4] — 2026-05-25

### Corregido
- Regenerado el compendio de reglas con registros de páginas de Journal compatibles con Foundry VTT 13; las entradas ya no aparecen vacías.
- Los botones de Resistencia física y mental de la pestaña Estado usan el estilo visual del sistema.

### Cambiado
- La hoja recuerda el tamaño asignado por usuario al cerrarla y lo recupera al abrirla de nuevo.
- Las ayudas contextuales de habilidades usan descripciones ampliadas tomadas del markdown de reglas.

### Añadido
- Nuevos compendios de Talentos, Poderes, Armas, Protecciones, PJ pregenerados, PNJ, Aventura Sangre en el agua y Tablas, generados desde `Ysystem3_compendios_codex.md`.

## [0.3.3] — 2026-05-24

### Cambiado
- Movido el Punto de guion al bloque de Valores como recurso consumible junto a Proezas.
- Reubicadas las etiquetas de umbral `RF`, `RM`, `-1D`, `-2D` y `-3D` en el espacio entre campos y casillas de Salud/Estabilidad.
- La llave inglesa de habilidades conserva el modo edición activo tras varias modificaciones hasta desactivarla o cerrar la hoja.
- Mejoradas las tarjetas de tirada del chat con resultado más visible, estados por color y color especial cuando una proeza convierte la tirada en éxito.
- Ampliado el tiempo de espera de la ayuda contextual al pasar el ratón por la ficha.

### Añadido
- Compendio de reglas `Reglas YSYSTEM3 SRD` con entradas de Journal generadas desde el markdown de reglas.
- Textos de ayuda contextual más completos para las reglas principales.

## [0.3.2] — 2026-05-24

### Cambiado
- Compactado el bloque de Valores en la hoja de resumen para ocupar una altura equivalente al bloque de Atributos.
- Separadas las marcas de umbral `RF`, `RM`, `-1D`, `-2D` y `-3D` de los campos y etiquetas de Salud/Estabilidad para evitar solapes visuales.
- La edición de dados de habilidades en el resumen queda bloqueada por defecto y se activa con un botón de llave inglesa.

### Añadido
- Campo de Punto de guion en la ficha de PJ, con valor actual, máximo, estado de uso, nota y ayuda contextual.

## [0.3.1] — 2026-05-24

### Corregido
- Se corrige la lectura de dados de habilidad en las tiradas desde la hoja. Si una ficha antigua no tiene `system.habilidades.<habilidad>.dados` persistido, la tirada usa 1D por defecto en lugar de quedarse en 0D y sumar solo atributo.
- Se añade reparación automática al abrir el mundo para completar las 24 habilidades de PJ/PNJ con valores legales de 1D a 3D, preservando los rangos ya existentes.
- Las tarjetas de tirada muestran la reserva base de la habilidad en el texto de la tirada para facilitar la comprobación en mesa.

## [0.3.0] — 2026-05-24

### Corregido
- Ajustadas las tiradas de habilidad al SRD: oposicion automatica contra Agilidad, Aplomo o Perspicacia del objetivo tarjeteado cuando procede.
- Las proezas de repeticion vuelven a estar disponibles tambien en Resistencia fisica y mental, y ya no pueden generar criticos en la repeticion.
- El dano extra por proezas en combate usa dados explosivos, como indica el SRD.
- Las protecciones aplican penalizadores SRD: armadura `floor(nivel/2)` y escudo `nivel`, solo a habilidades de DES y FUE.
- Los PNJ tambien reciben penalizadores por perdida de Salud.
- Las plantillas de arquetipo dejan de escribir campos heredados de otros sistemas y usan atributos, habilidades, Proezas y Resistencias de Ysystem3 SRD.

### Cambiado
- Manifiesto actualizado a Foundry VTT `verified: 13.351` y descarga de release `v0.3.0`.

## [0.2.1] — 2026-05-24

### Corregido
- Se actualiza el manifiesto `system.json` para apuntar al asset de descarga `v0.2.1`.
- Se corrige el workflow de publicación para generar un ZIP instalable por Foundry VTT.
- El ZIP de release empaqueta el sistema dentro de la carpeta `ysystem3-srd/`, que es el formato esperado para instalación manual o mediante manifiesto.
- Se añade ejecución manual del workflow (`workflow_dispatch`) para poder regenerar el release sin crear un tag localmente.

---

## [0.2.0] — 2026-05-24

### Primera publicación pública

Esta es la primera versión publicada en GitHub del sistema YSYSTEM3 SRD para Foundry VTT.

#### Añadido
- Hojas de personaje (PJ) y de PNJ optimizadas para pantalla, con pestañas por secciones.
- Modo clásico A4 seleccionable desde la configuración del mundo.
- Tiradas automatizadas: habilidades, Salud, Estabilidad, Resistencia física, Resistencia mental, Proezas, iniciativa y combate.
- Tipos de item: armas, armaduras, escudos, objetos, poderes, talentos y arquetipos.
- Compendio de reglas y ayudas de juego.
- Identidad visual del SRD: carátula «SRD actualizado» e icono oficial.
- Selector de apariencia/variante temática en configuración del mundo.
- Compatibilidad verificada con Foundry VTT v11–v13.

---

## Versiones futuras

Las nuevas versiones se publicarán como [Releases en GitHub](https://github.com/ManuRomera/ysystem3-srd/releases).
Foundry VTT comprobará actualizaciones automáticamente si instalaste el sistema mediante la URL del manifiesto.
