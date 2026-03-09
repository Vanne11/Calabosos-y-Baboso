# Motor Baboso — Documentación Técnica

> Motor de aventuras textuales narrativas con mecánicas RPG, escrito en TypeScript + React.
> Versión: 0.1.0 | ~18.000 líneas | 109 archivos

---

## Arquitectura y Motor

- [Arquitectura General](arquitectura.md)
- [El Motor (GameEngine)](game-engine.md)
- [Game Loop (useGameLoop)](game-loop.md)
- [Comunicación Motor <> UI (StepResult / PlayerAction)](step-result.md)

## Formato de Datos

- [Formato de Datos del Juego](formato-datos.md) — game.json + scenes.json
- [Sistema de Condiciones](condiciones.md)
- [Sistema de Efectos](efectos.md)

## Tipos de Pasos

- [Los 18 Tipos de Pasos](pasos/README.md) — Tabla resumen con links a cada paso

## Sistemas del Motor

- [Sistema de Dados (DiceRoller)](dados.md)
- [Sistema de Audio](audio.md)
- [Estado del Jugador (PlayerState)](player-state.md)
- [Sistemas RPG Avanzados](rpg.md) — Niveles, XP, Skills, Traits, Relaciones
- [Navegación Especial](navegacion.md)
- [Sistema de Guardado](guardado.md)

## Interfaz y Aplicación

- [Terminal y Comandos](comandos.md)
- [Rich Text (formato de texto)](rich-text.md)
- [Store Global (Zustand)](store.md)
- [Fases de la Aplicación](fases.md)
- [Editor Visual](editor.md)

## Referencia

- [Cargador de Juegos (GameLoader)](game-loader.md)
- [Estructura de Archivos](estructura-archivos.md)
- [Stack Tecnológico](stack.md)
- [Guía para Crear un Juego](guia-crear-juego.md)

---

## Mantenimiento de la documentación

Esta wiki debe mantenerse sincronizada con el código. Al hacer cambios significativos:

1. **Identificar qué docs afecta** — Tipos nuevos → `step-result.md`, campos de JSON → `formato-datos.md`, paso nuevo/modificado → `pasos/`, comando nuevo → `comandos.md`, estado nuevo → `store.md`, etc.
2. **Actualizar los archivos correspondientes** — No dejar docs desactualizados.
3. **Registrar el commit abajo** — Añadir una línea al historial con el hash, descripción y archivos tocados.

### Historial de cambios documentados

| Commit | Descripción | Archivos wiki actualizados |
|---|---|---|
| `1d50b4f` | Migración de DOCS.md monolítico a wiki (43 archivos) | Creación inicial de toda la wiki |
| `ae592b0` | Craft terminal: 5 acciones, mesa dinámica, IN[N] global | `pasos/craft.md`, `step-result.md`, `store.md`, `comandos.md` |
| `57fc39d` | Widget dimming, overlay inventario expandido | `store.md`, `comandos.md`, `step-result.md` |
| `8cfc40d` | Update ITEMS.md | N/A (solo assets) |

**Último commit documentado:** `8cfc40d`

---

*Documentación generada para Motor Baboso v0.1.0 — Calabosos y Babosos*
*Última actualización: 2026-03-09*
