# Demo Completa - Calabosos y Babosos

## Descripción

Demo jugable completa que muestra todas las mecánicas del juego:
- Sistema de diálogos interactivos con múltiples personajes
- Decisiones ramificadas con consecuencias
- Tiradas de dados (simuladas) con resultados variables
- Múltiples caminos para conseguir dinero
- Encuentro con NPCs importantes (Tendero, Nerly, Anciano)
- Exploración del Abismo de las Babosas

## Contenido de la Demo

### Escenas Incluidas

1. **Introducción**: Presentación del Narrador y BOB
2. **Plaza Principal**: Decisión inicial sobre la misión
3. **Conseguir Dinero** (3 rutas):
   - Trabajar en establos (con tirada de Miedo)
   - Vender relicario familiar (con tirada de Reputación)
   - Robar a un noble (con tirada de Reputación)
4. **Tienda del Tendero**: Compra de equipo básico
5. **Callejón Lateral**: Encuentro con Nerly
6. **Camino al Abismo**: Viaje con Nerly como guía
7. **Entrada al Abismo**: Encuentro con el Anciano
8. **Interior del Abismo**: Exploración de salas
9. **Grutas de Cristal**: Decisión final de la demo

### Personajes

- **Narrador**: Sarcástico y condescendiente
- **BOB**: El protagonista (jugador)
- **Tendero**: Vendedor ebrio
- **Nerly**: Babosa parlante, guía del jugador
- **Noble**: Objetivo de robo
- **Dueño de Establos**: Empleador de caballos mutantes
- **Prestamista**: Comprador de relicarios
- **Anciano**: Sabio que ve dimensiones

### Mecánicas Demostradas

- **Diálogos**: Conversaciones con múltiples personajes
- **Decisiones**: Opciones que afectan la narrativa
- **Tiradas de dados**: Sistema de resultados variables (Pifia, Fracaso, Éxito, Crítico)
- **Múltiples caminos**: Diferentes formas de alcanzar el mismo objetivo
- **Narrativa ramificada**: La historia cambia según las decisiones

## Archivos

- `info.json`: Metadata de la demo
- `characters.json`: Definición de personajes (9 personajes)
- `scenarios.json`: Escenarios visuales (11 escenas)
- `dialogs.json`: Todos los diálogos (70+ diálogos)
- `routes.json`: Rutas de navegación (19 rutas)
- `widgets.json`: Botones y opciones (16 widgets)
- `conditions.json`: Condiciones del juego
- `time.json`: Sistema de tiempo (deshabilitado)

## Flujo de Juego

```
Inicio
  ↓
Plaza Principal (Decisión inicial)
  ↓
Conseguir Dinero
  ├─ Establos (Tirada) ─┐
  ├─ Vender Relicario (Tirada) ─┤
  └─ Robar Noble (Tirada) ─┘
         ↓
    Tienda del Tendero
         ↓
    Callejón Lateral
         ↓
    Encuentro con Nerly
         ↓
    Camino al Abismo
         ↓
    Llegada al Abismo
         ↓
    Interior del Abismo
         ↓
    Grutas de Cristal
         ↓
       Final
```

## Estadísticas

- **Rutas totales**: 19
- **Diálogos totales**: 70+
- **Personajes**: 9
- **Escenarios**: 11
- **Widgets**: 16
- **Decisiones importantes**: 12+
- **Tiradas de dados**: 3 (Establos, Casa de Empeños, Robo)

## Características del Humor

El juego mantiene el tono satírico y meta-narrativo característico:
- El Narrador rompe constantemente la cuarta pared
- Comentarios sarcásticos sobre las decisiones del jugador
- Referencias a tropos de RPG
- Diálogos absurdos pero coherentes con el universo

## Notas para Desarrollo

Esta demo usa todos los recursos JSON disponibles en `/back/dialogos/`:
- Basada en `rutas_completo.json`
- Diálogos de `historia_completo.json`
- Tiradas de `tiradas/ciudad.json` y `combate_completo.json`

Para expandir la demo, consultar los archivos completos en `/back/` que contienen:
- Más rutas del Abismo
- Sistema de combate completo
- Encuentros adicionales
- Final con el Rey Baboso

## Cómo Jugar

1. Abrir el motor web en un navegador
2. Seleccionar "Demo" del menú de juegos
3. Seguir las instrucciones del Narrador
4. Elegir entre las opciones presentadas
5. Disfrutar del humor y las consecuencias de tus decisiones

## Versión

**v2.0.0** - Demo Completa Jugable
- Anterior: v1.0.0 (Demo básica de 3 escenas)
- Nueva: Demo completa con 19 rutas y sistema de tiradas

---

**Creado con material de**: `/back/dialogos/`
**Autores**: Nicolás y Vanessa
**Fecha**: 2025-12-11
