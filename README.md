# YSYSTEM3 SRD para Foundry VTT

> ⚠️ **VERSIÓN NO OFICIAL** — Este paquete **no está afiliado, aprobado, patrocinado ni publicado por Walhalla Ediciones** ni por ninguna persona relacionada con la editorial. Es un sistema fan-made de automatización para usar el SRD en mesa virtual.

Sistema para [Foundry VTT](https://foundryvtt.com/) basado en el **[Documento de Referencia del Sistema (SRD) de YSYSTEM](https://walhallaediciones.gitlab.io/ysystem/srd/)**, publicado por Walhalla Ediciones.

---

## Créditos y autoría del SRD

**YSYSTEM** es un reglamento genérico creado por:

- **Ignacio Sánchez Aranda** y **Jorge Carrero Roig** — autores del SRD
- **Walhalla Ediciones** — editorial titular y publicadora del SRD

El SRD oficial se puede consultar en: https://walhallaediciones.gitlab.io/ysystem/srd/

Este paquete implementa únicamente automatismos, hojas de personaje y herramientas de mesa virtual. No incluye texto cerrado, arte comercial, logos oficiales ni Product Identity de Walhalla Ediciones.

**Autor de este paquete (sistema Foundry VTT):** Manu Romera — no oficial, sin relación con Walhalla Ediciones.

---

## Contenido

- Hojas de PJ y PNJ optimizadas para pantalla, con pestañas por secciones y modo clásico A4 seleccionable desde configuración.
- Tiradas de habilidad, Salud, Estabilidad, Resistencia física, Resistencia mental, Proezas, iniciativa y combate.
- Items separados para armas, armaduras, escudos, objetos, poderes, talentos y arquetipos.
- Compendio de reglas y ayudas de juego.
- Identidad visual del SRD: carátula «SRD actualizado» e icono oficial de la web de Walhalla.
- Selector de apariencia/variante en configuración del mundo.

---

## Instalación

### Opción A — Instalación directa desde Foundry VTT (recomendada)

1. Abre Foundry VTT y ve a **Configuración → Sistemas de juego → Instalar sistema**.
2. En el campo **URL del Manifiesto**, pega esta URL:

   ```
   https://raw.githubusercontent.com/ManuRomera/ysystem3-srd/main/system.json
   ```

3. Haz clic en **Instalar**.
4. Foundry avisará automáticamente cuando haya nuevas actualizaciones disponibles.

### Opción B — Instalación manual

Descarga el zip de la [última versión](https://github.com/ManuRomera/ysystem3-srd/releases/latest), descomprímelo y copia la carpeta `ysystem3-srd` en `Data/systems/` de tu instalación de Foundry.

---

## Instalar una versión anterior

Si necesitas una versión específica por compatibilidad con tu versión de Foundry:

1. Ve a la página de [Releases](https://github.com/ManuRomera/ysystem3-srd/releases).
2. Localiza la versión que necesitas y descarga el archivo `ysystem3-srd.zip`.
3. Descomprímelo y copia la carpeta en `Data/systems/` de Foundry.

También puedes instalar directamente cualquier versión antigua usando la URL de su manifiesto específico. Busca en el release correspondiente el enlace al `system.json` de esa versión.

---

## Compatibilidad con Foundry VTT

| Versión del sistema | Foundry VTT mínimo | Foundry VTT verificado |
|---|---|---|
| 0.3.6 | v11 | v13.351 |
| 0.3.5 | v11 | v13.351 |
| 0.3.4 | v11 | v13.351 |
| 0.3.3 | v11 | v13.351 |
| 0.3.2 | v11 | v13.351 |
| 0.3.1 | v11 | v13.351 |
| 0.3.0 | v11 | v13.351 |
| 0.2.x | v11 | v13 |

---

## Historial de cambios

Consulta el [CHANGELOG.md](CHANGELOG.md) para ver el historial completo de versiones.

---

## Referencias

- SRD oficial: https://walhallaediciones.gitlab.io/ysystem/srd/
- Repositorio: https://github.com/ManuRomera/ysystem3-srd
- Releases: https://github.com/ManuRomera/ysystem3-srd/releases

---

## Licencia

El código, hojas, automatizaciones y recursos originales de este paquete se publican bajo licencia **MIT**. Las reglas y mecánicas declaradas como Open Game Content se referencian bajo la **Open Game License v1.0a**.

Consulta [LICENSE.md](LICENSE.md) para el texto completo de las licencias.
