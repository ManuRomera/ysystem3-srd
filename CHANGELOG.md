# Historial de cambios — YSYSTEM3 SRD para Foundry VTT

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue la convención [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).
El versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

---

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
