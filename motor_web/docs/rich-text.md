← [Volver al índice](README.md)

# Rich Text (formato de texto)

**Archivo:** `src/utils/richTextParser.ts`

El motor usa un formato de texto inspirado en Rich (Python) para dar color y estilo al texto de la terminal.

## Tags disponibles

| Tag | Efecto |
|---|---|
| `[bold]texto[/bold]` | Negrita |
| `[italic]texto[/italic]` | Cursiva |
| `[dim]texto[/dim]` | Atenuado (opacidad reducida) |
| `[red]texto[/red]` | Color rojo |
| `[green]texto[/green]` | Color verde |
| `[blue]texto[/blue]` | Color azul |
| `[yellow]texto[/yellow]` | Color amarillo |
| `[purple]texto[/purple]` | Color púrpura |
| `[cyan]texto[/cyan]` | Color cian |
| `[white]texto[/white]` | Color blanco |
| `[orange]texto[/orange]` | Color naranja |
| `[pink]texto[/pink]` | Color rosa |

## Tags compuestos

Se pueden combinar en un solo tag:
```
[bold red]Texto rojo y negrita[/bold red]
[bold italic green]Triple formato[/bold italic green]
```

## Emojis

Atajos de emoji soportados:
```
:snail: → 🐌    :castle: → 🏰    :sword: → ⚔️
:shield: → 🛡️   :skull: → 💀     :star: → ⭐
:fire: → 🔥     :gem: → 💎       :key: → 🔑
:potion: → 🧪
```

## Mapa de colores

```
red     → #ff5555
green   → #50fa7b
blue    → #8be9fd
yellow  → #f1fa8c
purple  → #bd93f9
cyan    → #8be9fd
white   → #ffffff
orange  → #ffb86c
pink    → #ff79c6
```
