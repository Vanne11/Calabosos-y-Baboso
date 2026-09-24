← [Volver al índice](README.md)

# Texto Narrativo: variables, pools, reglas y dados

Sistemas pensados para un narrador que reacciona, recuerda y se burla. Todo se configura en `game.json`. Implementación: `engine/NarrativeText.ts` (puro) y `GameEngine` (`buildDialog`, `runStatRules`, `diceHook`).

## Variables en textos

Disponibles en líneas de `dialog`, textos de `choice`, resultados de `dice`, `random` y `check`, y título/texto de `notify`.

| Variable | Valor |
|---|---|
| `{stat}` | Valor de la stat (ej. `{nombre_jugador}`, `{dinero}`) |
| `{meta.clave}` | Contador meta (0 si no existe) |

Las variables desconocidas se dejan tal cual.

## Pools de frases (`linePools`)

```jsonc
"linePools": {
  "pifia": ["Y tú eres nuestro futuro. Estamos jodidos.", "Un uno. UN UNO."],
  "muerte": [
    { "text": "Debimos buscar a alguien más competente.", "condition": { "meta": { "muertes": "<=1" } } },
    { "text": "Ya van {meta.muertes}.", "condition": { "meta": { "muertes": ">=2" } }, "weight": 2 }
  ]
}
```

- Cada entrada es un texto o `{ text, condition?, weight? }`.
- Se usan en `dialog.pool`, en `statRules[].pool` y en `diceHooks`.
- **Sin repetición:** el motor recuerda los índices usados por pool (`PlayerState.pools`, se guarda con la partida) y no repite hasta agotar las líneas elegibles; entonces rebaraja.

## Contadores meta

Números que **sobreviven a muertes, reinicios y partidas nuevas** (por juego, en localforage store `meta`, clave `<juego>:counters`).

- Sumar: `effects.meta: { "muertes": 1 }`.
- Condicionar: `condition.meta: { "muertes": ">=3" }`.
- Mostrar: `{meta.muertes}`.
- El game loop los carga en `startGame()` (`engine.loadMeta`) y los guarda cada vez que cambian (`engine.setMetaListener`). `reset()` y `restoreState()` conservan los contadores actuales.

## Reglas automáticas (`statRules`)

Se evalúan **después de cada paso**. Si una regla navega, su `goto` tiene prioridad sobre el del paso.

```jsonc
"statRules": [
  { "id": "muerte", "condition": { "stats": { "ganas_de_vivir": "<=0" } }, "goto": "muerte" },
  { "id": "accidente_pis", "condition": { "stats": { "pis": ">=100" } }, "pool": "accidente_pis",
    "effects": { "setStats": { "pis": 0 }, "stats": { "sexi": -15 } } },
  { "id": "humedad", "once": true, "condition": { "stats": { "pis": ">=70" } }, "lines": ["Noto cierta humedad..."] }
]
```

| Campo | Descripción |
|---|---|
| `id` | Obligatorio y único |
| `condition` | `StepCondition` |
| `once` | Solo una vez por partida (`PlayerState.rulesFired`) |
| `character` | Quién habla (default: el narrador) |
| `lines` / `pool` | Texto a mostrar |
| `effects` | Efectos a aplicar. **Una regla repetible debe desactivarse con sus efectos** (ej. `pis` a 0) |
| `goto` | Navegar. La regla no se dispara dentro de su propia escena destino (evita bucles) |

Se encadenan hasta 5 reglas por paso. Gana la primera regla que cumpla, en el orden del array.

## Reacciones a dados (`diceHooks`)

```jsonc
"diceHooks": {
  "critical_failure": { "pool": "pifia" },
  "critical_success": { "pool": "critico" },
  "failure": { "pool": "fracaso", "chance": 0.35 }
}
```

Tras el resultado de un paso `dice`, el narrador (o `character`) dice una línea del pool con probabilidad `chance` (default 1).

## Modificadores globales de dados (`diceModifiers`)

```jsonc
"diceModifiers": [{ "stat": "miedo", "per": 25, "amount": -1 }]
```

Suma `floor(stat / per) * amount` al modificador de **todas** las tiradas (paso `dice` y tiradas de tienda). Ej.: miedo 60 → -2.

## Límites de stats (`statDefs.min` / `max`)

```jsonc
"statDefs": { "pis": { "label": "Pis", "icon": "💧", "min": 0, "max": 100 } }
```

El motor recorta las stats tras cada efecto, antes de evaluar las reglas.
