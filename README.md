<p align="center">
  <img src="public/images/logo.png" alt="Calabosos y Babosos Logo" width="200">
</p>

<h1 align="center">Motor Baboso</h1>

<p align="center">
  <em>A slimy interactive fiction engine for the browser. Build text adventures with images, dice rolls, combat, crafting, puzzles, and a terminal that judges you. Because the world needed another game engine nobody asked for.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript" alt="TypeScript 5.9">
  <img src="https://img.shields.io/badge/Vite-6.2-646cff?logo=vite" alt="Vite 6.2">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
</p>

<p align="center">
  <b>English</b> | <a href="README_ES.md">Español</a>
</p>

---

## What Is Motor Baboso?

**Motor Baboso** is a browser-based engine for creating and playing interactive fiction games. It's not a game — it's the thing that *runs* games. Think of it as an overly opinionated, terminally sarcastic RPG Maker that lives inside a fake Linux terminal.

You define your entire game in JSON (scenes, dialogues, items, skill trees, combat encounters, puzzles...) and the engine handles the rest: rendering, state management, dice rolls, save/load, audio, the works. No code required to make a game. Just JSON and questionable life choices.

### What can you build with it?

- Text adventures with images and branching narratives
- RPGs with stats, levels, XP, skill trees, traits, and relationships
- Games with D20 dice mechanics, turn-based combat, shops, and crafting
- Puzzle games with codes, riddles, locks, and sequences
- Anything narrative-driven, really. The engine doesn't judge your genre. The Narrator, on the other hand...

### Currently ships with two demos:

- **Calabosos y Babosos** — A satirical fantasy adventure in the kingdom of Viscaria where you play as BOB trying to defeat the Slug King. Full narrative with shops, combat, NPCs, and a narrator who hates your guts.
- **Demo Tecnica** — A technical showcase demonstrating all 18 step types: puzzles, crafting, combat, timed choices, level-up screens, and more.

---

## Screenshots

<p align="center">
  <img src="public/images/screenshots/terminal.png" alt="Terminal gameplay" width="45%">
  &nbsp;
  <img src="public/images/screenshots/editor.png" alt="Visual story editor" width="45%">
</p>

<p align="center">
  <img src="public/images/screenshots/game.png" alt="In-game scene" width="45%">
  &nbsp;
  <img src="public/images/screenshots/combat.png" alt="Combat or interactive widget" width="45%">
</p>

<p align="center">
  <sub>The terminal, the visual editor, and in-game scenes. It almost looks professional if you squint.</sub>
</p>

---

## Quick Start

```bash
# Clone the repo (you're already here, genius)
npm install          # Drag yourself into the dependency abyss
npm run dev          # Launch at localhost:5173 (where hopes go to die)
```

That's it. No `cd motor_web` anymore — everything lives at the root because we reorganized like adults. Almost.

---

## Features (The Ones We're Proud Of, Anyway)

### The Terminal

The whole thing runs inside a fake Linux terminal. Boot sequence, login prompt, shell commands — the full hacker cosplay experience. Type `help` and pretend you know what you're doing.

### The Engine

Pure TypeScript. Zero React dependencies. Uses async generators (`async *enterScene()`) to yield `StepResult` objects that the UI renders. The UI sends back `PlayerAction` when it needs input. Clean separation. The engine doesn't know what a DOM is, and it's happier that way.

### 18 Step Types

Because 17 wasn't enough and 19 felt greedy:

| Type | What it does | Needs input? |
|---|---|---|
| `dialog` | Shows character dialogue (prepare for insults) | No |
| `choice` | Player picks an option (the illusion of control) | Yes |
| `dice` | D20 roll with modifiers (let math ruin your day) | Yes |
| `input` | Free text (we will judge your spelling) | Yes |
| `effects` | Silently applies consequences (surprise!) | No |
| `branch` | Auto-routes based on conditions | No |
| `random` | Weighted random outcome (like life, but fairer) | No |
| `check` | Deterministic stat check (spoiler: you'll fail) | No |
| `shop` | Buy/sell interface (capitalism in fantasy) | Yes |
| `combat` | Turn-based combat (violence is always an option) | Yes |
| `notify` | Visual notification (bad news, usually) | No |
| `wait` | Dramatic pause (killing hopes slowly) | No |
| `sound` | Sound effect (trauma needs a soundtrack) | No |
| `craft` | Combine items (play pretend alchemist) | Yes |
| `puzzle` | Code/riddle/lock/sequence (brain not included) | Yes |
| `examine` | Inspect environment (touch everything, regret it) | Yes |
| `use_item` | Use item on target, LucasArts-style | Yes |
| `timed_choice` | Options with a timer (panic simulator) | Yes |
| `level_up` | Level up / pick skills (false progress) | Yes |

### The Visual Editor

A full drag-and-drop story editor built with ReactFlow. Create scenes, connect them, edit all 18 step types visually, validate your game, export/import projects. It's like a flowchart but it actually does something useful.

### RPG Systems

Levels, XP, skill trees, traits, character relationships with affinity scores, timed events, day/night cycles. Your characters will have more personal growth than you ever will.

### Save/Load

Free save, checkpoint-based, or slot-based saving. Powered by localforage (IndexedDB). Your bad decisions will persist across browser sessions. You're welcome.

### Audio

Background music with crossfade, per-scene tracks, sound effects. Because good trauma needs a proper soundtrack.

---

## Architecture

```
React UI (components, widgets, terminal)
    ↕ useGameLoop (consumes StepResults, sends PlayerActions)
    ↕ Zustand Store (useAppStore)
    ↕
GameEngine (pure TypeScript, async generators)
    ├── ConditionEvaluator    (judges your every move)
    ├── EffectsApplier        (applies what you deserve)
    ├── DiceRoller            (cold mathematics)
    └── AudioManager          (soundtrack for suffering)
```

In other words: the engine does the thinking because you clearly can't.

---

## Application Phases (Stages of Grief)

```
boot → login → shell → game
                 └──── editor
```

| Phase | What happens |
|---|---|
| `boot` | Animated Linux boot (maximum hacker roleplay) |
| `login` | Sarcastic prompt (every answer is wrong) |
| `shell` | Free terminal where you pretend to know commands |
| `game` | The actual suffering begins |
| `editor` | Visual story editor (create suffering for others) |

---

## Game Data Format

A game is just 2 JSON files in `public/games/{name}/`. That's it. No code, no compilation, no dignity.

**game.json** — Manifest: characters, items, stats, skill trees, traits, save config

**scenes.json** — All scenes with sequences of the 18 step types

```jsonc
{
  "scenes": {
    "start": {
      "scenario": { "name": "Start", "image": "images/plaza.png" },
      "sequence": [
        { "type": "dialog", "character": "narrator", "lines": ["Welcome. You look lost. As usual."] },
        { "type": "choice", "options": [
          { "text": "Explore", "goto": "exploration" },
          { "text": "Question my life choices", "goto": "_quit" }
        ]}
      ]
    }
  }
}
```

Want to make a game? Write JSON. Screw up the JSON? The engine will tell you about it. Sarcastically.

---

## Documentation (For the Brave and the Foolish)

Full technical docs live in [`docs/`](docs/). Read them. Or don't. The Narrator doesn't care.

### Core Systems
- [Architecture](docs/arquitectura.md) — How this abomination holds together
- [Game Engine](docs/game-engine.md) — The "brain" of the operation
- [Game Loop](docs/game-loop.md) — The infinite cycle of suffering
- [Game Loader](docs/game-loader.md) — Loads games, judges your design
- [Player State](docs/player-state.md) — A record of your failures
- [Store (Zustand)](docs/store.md) — Where trauma is persisted

### Game Mechanics
- [Data Format](docs/formato-datos.md) — JSON structures (creative = broken)
- [Conditions](docs/condiciones.md) — Logic from hell
- [Effects](docs/efectos.md) — Consequences you deserve
- [Dice System](docs/dados.md) — Math decides your fate
- [Navigation & Goto](docs/navegacion.md) — Where to go (you can't decide)
- [RPG Systems](docs/rpg.md) — XP, Skills, Traits
- [Save/Load](docs/guardado.md) — Immortalize your mistakes
- [Audio](docs/audio.md) — Soundtrack for every trauma

### UI & Presentation
- [Application Phases](docs/fases.md) — Stages of grief, explained
- [Terminal Commands](docs/comandos.md) — For pretending you're a hacker
- [Rich Text Format](docs/rich-text.md) — Making mediocre content look fancy
- [StepResult Reference](docs/step-result.md) — What the engine spits at you
- [File Structure](docs/estructura-archivos.md) — Where everything lives (and dies)
- [Tech Stack](docs/stack.md) — The glue and duct tape
- [Visual Editor](docs/editor.md) — Drag boxes, call it game design

### All 18 Step Types
- [Dialog](docs/pasos/dialog.md) &bull; [Choice](docs/pasos/choice.md) &bull; [Dice](docs/pasos/dice.md) &bull; [Input](docs/pasos/input.md) &bull; [Effects](docs/pasos/effects.md) &bull; [Branch](docs/pasos/branch.md) &bull; [Random](docs/pasos/random.md) &bull; [Check](docs/pasos/check.md)
- [Shop](docs/pasos/shop.md) &bull; [Combat](docs/pasos/combat.md) &bull; [Notify](docs/pasos/notify.md) &bull; [Wait](docs/pasos/wait.md) &bull; [Sound](docs/pasos/sound.md) &bull; [Craft](docs/pasos/craft.md) &bull; [Puzzle](docs/pasos/puzzle.md) &bull; [Examine](docs/pasos/examine.md)
- [Use Item](docs/pasos/use-item.md) &bull; [Timed Choice](docs/pasos/timed-choice.md) &bull; [Level Up](docs/pasos/level-up.md)

### Guides
- [How to Create a Game](docs/guia-crear-juego.md) — (Spoiler: you'll ruin it)

---

## Project Structure

```
Calabosos-y-Baboso/
├── src/
│   ├── engine/             Pure TypeScript engine (the "brain")
│   ├── types/              Type definitions
│   ├── hooks/              React hooks (game loop, terminal, boot)
│   ├── store/              Zustand stores (trauma, persisted)
│   ├── components/         UI (terminal, widgets, layout)
│   ├── editor/             Visual story editor (~5,900 lines)
│   ├── styles/             Themes from "dark" to "darker"
│   └── utils/              Rich text parser, helpers
├── public/games/           Available games
│   ├── demo/               "Calabosos y Babosos" full demo
│   └── demo2/              Technical demo (all 18 step types)
├── docs/                   Technical wiki (~40 docs)
├── back/                   Legacy Python terminal (the fossil record)
└── CLAUDE.md               AI assistant instructions
```

---

## Tech Stack

| Technology | Why |
|---|---|
| **React 19** + **TypeScript 5.9** | UI & types (pretending we're professionals) |
| **Vite 6.2** | Fast bundler (reinventing wheels is for the unimaginative) |
| **Zustand 5.0** | State management (registry of your failures) |
| **@xyflow/react 12.10** | Visual editor (dragging boxes = "game design") |
| **styled-components 6.1** | CSS-in-JS (even slugs deserve to look pretty) |
| **localforage** | IndexedDB persistence (bad decisions follow you forever) |
| **jszip + file-saver** | Export/import (hopes and dreams in a ZIP) |

---

## Development

```bash
npm install          # First time (embrace the node_modules abyss)
npm run dev          # Dev server at localhost:5173
npm run build        # Production build (assuming you get this far)
npm run lint         # ESLint (it always finds something to complain about)
```

### Git Branches

- **main** — Stable (relatively speaking)
- **cyb-web** — Active development (chaos in progress)

---

## Troubleshooting (a.k.a. "Features")

**"My game crashes at a certain scene"** — It's not a bug, it's a metaphor for how life stops at the worst moments. (Real fix: circular condition or invalid reference)

**"Images won't load"** — The engine is protecting players from your "art". (Real fix: check paths, must be relative to the game folder)

**"The narrator insults me too much"** — That's not a bug. That's a feature. He's being nice, actually.

**"I can't progress"** — Welcome to real life. (Real fix: use `debug` to check unmet conditions)

**"My JSON has errors but looks fine"** — Perfection is impossible to achieve, especially for you. (Real fix: external JSON validator, ghost commas are lurking)

---

## Authors

<p align="center">
  <img src="public/images/about/about1.png" alt="Vanessa, Nicolas & Nerly" width="400">
</p>

<p align="center">
  Built with love (and slime) by <b>Nicolas & Vanessa</b>
</p>

---

## License

MIT — With the slimy clause: if you use this engine to make a serious or *educational* game, a slug will haunt your dreams for all eternity.

---

> *"You've reached the end of this README. Your reading stats increased by +5. Your dignity, probably not. Remember: this is not a game, it's an engine that runs games. The difference is viscous but important. Like many things in life, this project is just an empty shell waiting for you to fill it with content... just like your existence."*

Enjoy the abyss. It'll be waiting.

Forget it, we'll write however we want with an S. The Z is for the guy in the black mask!

— Nicolas & Vanessa
