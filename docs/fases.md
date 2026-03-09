← [Volver al índice](README.md)

# Fases de la Aplicación

```
boot → login → shell → game
                  │        │
                  │        └─ (resetGame) → shell/editor
                  │
                  └─ editor
```

| Fase | Descripción |
|---|---|
| `boot` | Secuencia de arranque estilo Linux con mensajes animados |
| `login` | Pantalla de usuario/contraseña con comentarios sarcásticos |
| `shell` | Terminal libre donde se escriben comandos |
| `game` | Juego en ejecución (motor activo, widgets visibles) |
| `editor` | Editor visual de historias con ReactFlow |
