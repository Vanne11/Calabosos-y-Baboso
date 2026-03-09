# Plan: Paquete Ejecutable Standalone para CyB

## Objetivo

Permitir que un usuario del editor web exporte su juego como un **paquete descargable** que cualquier persona pueda ejecutar sin navegador, sin instalaciones, sin ver los archivos del juego en crudo.

**Resultado final para el jugador:**
```
MiJuego.zip (descarga desde el editor)
└── MiJuego/
    ├── CyBPlayer.exe          ← Ejecutable del motor (Windows)
    ├── CyBPlayer              ← Ejecutable del motor (Linux)
    ├── CyBPlayer.app          ← Ejecutable del motor (macOS)
    └── data/
        └── game.cyb           ← Datos del juego empaquetados y ofuscados
```

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    EDITOR WEB (React)                        │
│                                                              │
│  El usuario crea su juego normalmente                        │
│  Click en "Exportar Ejecutable"                              │
│                                                              │
│  1. Serializa game.json + scenes.json + assets               │
│  2. Empaqueta todo en un archivo .cyb (ofuscado)             │
│  3. Descarga ZIP con binario pre-compilado + game.cyb        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    PAQUETE ZIP                                │
│                                                              │
│  MiJuego/                                                    │
│  ├── CyBPlayer.exe     ← Binario Tauri pre-compilado        │
│  └── data/                                                   │
│      └── game.cyb      ← ZIP ofuscado con XOR + header      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 TAURI PLAYER (runtime)                        │
│                                                              │
│  1. Al arrancar, busca data/game.cyb                         │
│  2. Lee el archivo, revierte ofuscación                      │
│  3. Descomprime ZIP en memoria                               │
│  4. Sirve los archivos vía protocolo custom de Tauri         │
│  5. El frontend React (motor) carga y ejecuta el juego       │
└─────────────────────────────────────────────────────────────┘
```

---

## Parte 1: Formato `.cyb` (Empaquetado de Datos)

### Estructura Interna

El archivo `.cyb` es un ZIP con ofuscación por capas:

```
Archivo .cyb:
┌──────────────────────────────────┐
│  Header magic: "CYB\x01"  (4B)  │  ← Identifica el formato
│  Version: uint8           (1B)  │  ← Versión del formato (1)
│  XOR key length: uint8    (1B)  │  ← Largo de la clave XOR
│  XOR key: bytes           (NB)  │  ← Clave XOR (generada al exportar)
│  Checksum: uint32 LE      (4B)  │  ← CRC32 del ZIP original
│  Payload: XOR'd ZIP       (*)   │  ← ZIP cifrado con XOR
└──────────────────────────────────┘
```

### Proceso de Empaquetado (en el editor web)

```typescript
// Pseudocódigo del empaquetador
async function packCyb(gameFiles: Map<string, Blob>): Promise<Blob> {
  // 1. Crear ZIP en memoria con JSZip
  const zip = new JSZip();
  zip.file('game.json', gameFiles.get('game.json'));
  zip.file('scenes.json', gameFiles.get('scenes.json'));
  for (const [path, blob] of gameFiles) {
    if (path.startsWith('images/') || path.startsWith('audio/')) {
      zip.file(path, blob);
    }
  }
  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

  // 2. Generar clave XOR aleatoria (16-32 bytes)
  const xorKey = crypto.getRandomValues(new Uint8Array(24));

  // 3. Calcular CRC32 del ZIP original
  const checksum = crc32(zipBuffer);

  // 4. Aplicar XOR al ZIP
  const encrypted = xorEncrypt(new Uint8Array(zipBuffer), xorKey);

  // 5. Construir archivo .cyb
  const header = new Uint8Array([
    0x43, 0x59, 0x42, 0x01,  // "CYB\x01"
    0x01,                      // version 1
    xorKey.length,             // key length
    ...xorKey,                 // key bytes
    ...uint32LE(checksum),     // checksum
  ]);

  return new Blob([header, encrypted]);
}
```

### Proceso de Desempaquetado (en el player Tauri)

```rust
// Pseudocódigo Rust (backend Tauri)
fn unpack_cyb(path: &Path) -> Result<HashMap<String, Vec<u8>>> {
    let data = fs::read(path)?;

    // 1. Verificar magic header
    assert_eq!(&data[0..4], b"CYB\x01");

    // 2. Leer versión y clave XOR
    let version = data[4];
    let key_len = data[5] as usize;
    let xor_key = &data[6..6 + key_len];

    // 3. Leer checksum
    let checksum_offset = 6 + key_len;
    let expected_checksum = u32::from_le_bytes(data[checksum_offset..checksum_offset+4]);

    // 4. Descifrar payload
    let payload_offset = checksum_offset + 4;
    let decrypted = xor_decrypt(&data[payload_offset..], xor_key);

    // 5. Verificar integridad
    assert_eq!(crc32(&decrypted), expected_checksum);

    // 6. Descomprimir ZIP en memoria
    let archive = ZipArchive::new(Cursor::new(decrypted))?;
    let mut files = HashMap::new();
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let mut contents = Vec::new();
        file.read_to_end(&mut contents)?;
        files.insert(file.name().to_string(), contents);
    }

    Ok(files)
}
```

### Nivel de Seguridad

- **No es criptografía fuerte** - un reverse engineer determinado puede romperlo
- **Suficiente para** impedir que un usuario casual abra los archivos, copie assets, o modifique el juego
- **XOR con clave variable** - cada `.cyb` tiene clave diferente, no se puede hacer un "unlocker" universal sin analizar el formato
- Si en el futuro se quiere más seguridad, se puede reemplazar XOR por AES sin cambiar la estructura (solo el campo version)

---

## Parte 2: Proyecto Tauri - CyBPlayer

### Estructura del Proyecto

```
cyb-player/                         ← Nuevo proyecto separado
├── Cargo.toml                      ← Dependencias Rust
├── tauri.conf.json                 ← Configuración Tauri
├── src-tauri/
│   ├── main.rs                     ← Punto de entrada Rust
│   ├── cyb_loader.rs               ← Lector de archivos .cyb
│   ├── asset_server.rs             ← Servir assets desde memoria
│   ├── icons/                      ← Iconos del ejecutable
│   └── Cargo.toml
├── src/                            ← Frontend React (el motor)
│   ├── main.jsx
│   ├── App.tsx                     ← Versión simplificada (solo player)
│   ├── engine/                     ← Motor del juego (copiado/compartido)
│   │   ├── GameEngine.ts
│   │   ├── GameLoader.ts           ← MODIFICADO: carga desde Tauri IPC
│   │   ├── ConditionEvaluator.ts
│   │   ├── EffectsApplier.ts
│   │   └── DiceRoller.ts
│   ├── components/                 ← Componentes del juego (copiados)
│   │   ├── terminal/
│   │   ├── layout/
│   │   └── game/
│   ├── store/
│   ├── hooks/
│   ├── types/
│   └── styles/
├── package.json
└── vite.config.ts
```

### Flujo de Ejecución del Player

```
Usuario hace doble click en CyBPlayer.exe
         │
         ▼
┌─────────────────────────────────┐
│  1. Tauri arranca               │
│  2. Busca data/game.cyb         │
│     - Mismo directorio que exe  │
│     - Si no existe → error      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  3. cyb_loader.rs               │
│     - Lee game.cyb              │
│     - Verifica header           │
│     - Descifra XOR              │
│     - Verifica CRC32            │
│     - Descomprime ZIP           │
│     - Almacena en memoria       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  4. asset_server.rs             │
│     - Registra protocolo custom │
│       "cyb://game.json"         │
│       "cyb://scenes.json"       │
│       "cyb://images/foo.png"    │
│     - Sirve archivos desde RAM  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  5. Frontend React arranca      │
│     - GameLoader usa fetch()    │
│       contra protocolo cyb://   │
│     - Motor ejecuta el juego    │
│     - Player juega normalmente  │
└─────────────────────────────────┘
```

### Protocolo Custom de Tauri

Tauri permite registrar protocolos custom para servir archivos. Esto es clave:

```rust
// En main.rs
tauri::Builder::default()
    .register_asynchronous_uri_scheme_protocol("cyb", move |_app, request, responder| {
        // request.uri() → "cyb://images/plaza.png"
        let path = request.uri().path(); // "images/plaza.png"

        // Buscar en los archivos descomprimidos en memoria
        if let Some(data) = game_files.get(path) {
            let mime = mime_guess::from_path(path);
            responder.respond(
                HttpResponseBuilder::new()
                    .header("Content-Type", mime)
                    .body(data.clone())
            );
        } else {
            responder.respond(HttpResponseBuilder::new().status(404).body(vec![]));
        }
    })
```

### GameLoader Modificado (para el player)

La única diferencia con el motor web es cómo carga los archivos:

```typescript
// GameLoader para el player Tauri
// En vez de fetch('public/games/demo/game.json')
// Hace fetch('cyb://game.json')

export async function loadGame(): Promise<{ manifest: GameManifest; scenes: ScenesFile }> {
  const manifestRes = await fetch('cyb://game.json');
  const manifest = await manifestRes.json();

  const scenesRes = await fetch('cyb://scenes.json');
  const scenes = await scenesRes.json();

  return { manifest, scenes };
}

// Los paths de assets en el JSON ya son relativos:
// "images/plaza.png" → se resuelve como "cyb://images/plaza.png"
```

### Configuración Tauri (tauri.conf.json)

```json
{
  "build": {
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "tauri": {
    "bundle": {
      "active": true,
      "identifier": "com.cyb.player",
      "icon": ["icons/icon.png"],
      "targets": ["nsis", "deb", "appimage", "dmg"],
      "resources": []
    },
    "windows": [{
      "title": "",
      "width": 1280,
      "height": 800,
      "resizable": true,
      "fullscreen": false
    }],
    "security": {
      "csp": null
    }
  }
}
```

Nota: el título de la ventana se lee dinámicamente del `game.json` (campo `name`).

### Dependencias Rust

```toml
[dependencies]
tauri = { version = "2", features = ["protocol-asset"] }
zip = "0.6"
crc32fast = "1.3"
mime_guess = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

---

## Parte 3: Exportador en el Editor Web

### Nuevo Botón en EditorToolbar

Añadir opción **"Exportar Ejecutable"** junto al actual "Exportar ZIP":

```
┌─────────────────────────────────────────────────────┐
│  EditorToolbar                                       │
│  [Guardar] [Exportar ZIP ▾]  [Importar]  [Config]  │
│                  │                                    │
│                  ├─ Exportar ZIP (actual)             │
│                  └─ Exportar Ejecutable (nuevo)       │
└─────────────────────────────────────────────────────┘
```

### Flujo de "Exportar Ejecutable"

```typescript
async function exportExecutable(platform: 'windows' | 'linux' | 'macos') {
  // 1. Validar proyecto (igual que exportar ZIP)
  const errors = validateProject(project, nodes);
  if (errors.length > 0) throw new Error('Proyecto con errores');

  // 2. Convertir a GameManifest + ScenesFile (reutilizar exportProject.ts)
  const { manifest, scenes } = projectToManifest(project, nodes);

  // 3. Recolectar assets
  const assets = await exportAllAssets(project.id);

  // 4. Crear archivo .cyb
  const gameFiles = new Map<string, Blob>();
  gameFiles.set('game.json', new Blob([JSON.stringify(manifest, null, 2)]));
  gameFiles.set('scenes.json', new Blob([JSON.stringify(scenes, null, 2)]));
  for (const [filename, blob] of assets) {
    gameFiles.set(filename, blob); // "images/foo.png", "audio/bar.mp3"
  }
  const cybBlob = await packCyb(gameFiles);

  // 5. Descargar binario pre-compilado del servidor
  //    (o tenerlo embebido como asset estático)
  const playerBinary = await fetchPlayerBinary(platform);

  // 6. Crear ZIP final
  const finalZip = new JSZip();
  const folderName = sanitize(project.name);
  finalZip.file(`${folderName}/${getExecutableName(platform)}`, playerBinary);
  finalZip.file(`${folderName}/data/game.cyb`, cybBlob);

  // 7. Descargar
  const blob = await finalZip.generateAsync({ type: 'blob' });
  saveAs(blob, `${folderName}-${platform}.zip`);
}
```

### Distribución de Binarios Pre-compilados

Los binarios del player se deben **hostear en algún lugar** accesible:

**Opción A: CDN / GitHub Releases (recomendado)**
```
https://github.com/{repo}/releases/download/player-v1.0/
├── CyBPlayer-windows.exe    (~8 MB)
├── CyBPlayer-linux          (~12 MB)
└── CyBPlayer-macos          (~10 MB)
```

**Opción B: Assets estáticos en el propio servidor web**
```
public/player-binaries/
├── CyBPlayer-windows.exe
├── CyBPlayer-linux
└── CyBPlayer-macos
```

**Opción C: Compilación bajo demanda (descartada)**
- Requiere servidor con toolchain de Rust
- Lento, costoso, complejo
- No tiene sentido porque el binario es siempre el mismo

---

## Parte 4: Diferencias entre Motor Web y Motor Player

| Aspecto | Motor Web | Motor Player (Tauri) |
|---------|-----------|---------------------|
| Carga de datos | `fetch('/games/{name}/game.json')` | `fetch('cyb://game.json')` |
| Assets | Paths relativos a `/public/` | Protocolo `cyb://` |
| Login | Sí (configurable) | Opcional (skip por defecto) |
| Boot sequence | Sí | Sí (lee nombre del juego) |
| Secuencia de boot | Genérica del motor | Personalizable por el creador |
| Editor | Incluido | **NO incluido** |
| Comandos terminal | `run`, `list`, `debug`, etc. | Solo lo necesario para jugar |
| Múltiples juegos | Sí (`list` + `run`) | Un solo juego embebido |
| Guardado | LocalForage | LocalStorage o archivo local |
| Título ventana | "CyB Motor" | Nombre del juego |
| Icono | Genérico CyB | Personalizable por creador |

### Componentes a Compartir (monorepo o copiar)

Se comparten sin cambios:
- `src/engine/GameEngine.ts`
- `src/engine/ConditionEvaluator.ts`
- `src/engine/EffectsApplier.ts`
- `src/engine/DiceRoller.ts`
- `src/engine/AudioManager.ts`
- `src/components/terminal/*`
- `src/components/layout/*`
- `src/components/game/*`
- `src/store/useAppStore.ts`
- `src/hooks/useGameLoop.ts`
- `src/hooks/useBootSequence.ts`
- `src/types/*`
- `src/styles/*`
- `src/utils/*`

Se modifican:
- `src/engine/GameLoader.ts` → Protocolo `cyb://`
- `src/App.tsx` → Sin editor, sin selector de juego, carga directa
- `src/hooks/useTerminalCommands.ts` → Comandos reducidos

Se eliminan:
- `src/editor/*` (todo)
- Comandos `run`, `list`, `debug` del terminal

---

## Parte 5: Plan de Implementación

### Fase 1: Formato .cyb y utilidades (en motor_web)

**Archivos nuevos:**
```
src/editor/utils/cybFormat.ts       ← Empaquetador .cyb (pack/unpack)
src/editor/utils/crc32.ts           ← Implementación CRC32
```

**Tareas:**
1. Implementar `crc32()` (puro JS, ~30 líneas)
2. Implementar `xorEncrypt(data, key)` y `xorDecrypt(data, key)`
3. Implementar `packCyb(files: Map<string, Blob>): Promise<Blob>`
4. Implementar `unpackCyb(blob: Blob): Promise<Map<string, Blob>>` (para testing)
5. Tests: empaquetar → desempaquetar → verificar integridad

### Fase 2: Botón "Exportar Ejecutable" en el editor

**Archivos modificados:**
```
src/editor/components/toolbar/EditorToolbar.tsx   ← Nuevo botón
src/editor/utils/exportProject.ts                 ← Función exportExecutable()
```

**Tareas:**
1. Añadir dropdown "Exportar" con opciones ZIP y Ejecutable
2. Selector de plataforma (Windows / Linux / macOS)
3. Implementar `exportExecutable()` que:
   - Reutiliza `projectToManifest()` existente
   - Llama a `packCyb()`
   - Descarga binario pre-compilado (o placeholder por ahora)
   - Genera ZIP final con exe + data/game.cyb
4. UI de progreso durante la exportación

### Fase 3: Proyecto Tauri - CyBPlayer

**Proyecto nuevo:**
```
cyb-player/                    ← Nuevo directorio en la raíz del repo
├── src-tauri/                 ← Backend Rust
│   ├── src/
│   │   ├── main.rs
│   │   ├── cyb_loader.rs
│   │   └── asset_server.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
├── src/                       ← Frontend (subconjunto del motor)
│   ├── main.jsx
│   ├── PlayerApp.tsx          ← App simplificada
│   ├── engine/                ← Copiado de motor_web/src/engine/
│   ├── components/            ← Copiado de motor_web/src/components/
│   ├── types/                 ← Copiado de motor_web/src/types/
│   ├── store/
│   ├── hooks/
│   ├── styles/
│   └── utils/
├── package.json
└── vite.config.ts
```

**Tareas:**
1. Inicializar proyecto Tauri v2 con `npm create tauri-app`
2. Implementar `cyb_loader.rs`:
   - Leer archivo .cyb del disco
   - Parsear header (magic, version, key, checksum)
   - Descifrar XOR
   - Verificar CRC32
   - Descomprimir ZIP con crate `zip`
   - Almacenar archivos en `HashMap<String, Vec<u8>>`
3. Implementar `asset_server.rs`:
   - Registrar protocolo `cyb://`
   - Servir archivos desde el HashMap en memoria
   - MIME types correctos según extensión
4. Implementar `main.rs`:
   - Al arrancar: detectar ruta del exe → buscar `data/game.cyb`
   - Cargar .cyb → servir vía protocolo custom
   - Leer nombre del juego → título de ventana
   - Abrir WebView con el frontend
5. Copiar frontend del motor (sin editor):
   - Modificar `GameLoader.ts` para usar `cyb://`
   - Crear `PlayerApp.tsx` simplificado
   - Eliminar comandos innecesarios
6. Compilar para Windows, Linux, macOS
7. Subir binarios a GitHub Releases

### Fase 4: Integración y pulido

**Tareas:**
1. Conectar editor con binarios reales (URL de descarga)
2. Testing end-to-end:
   - Crear juego en editor
   - Exportar ejecutable
   - Descomprimir
   - Ejecutar en cada plataforma
3. Manejar errores:
   - `.cyb` corrupto → mensaje amigable
   - `.cyb` no encontrado → instrucciones
   - Versión incompatible → aviso de actualización
4. Personalización por el creador:
   - Nombre de la ventana (desde game.json)
   - Icono custom (futuro - requiere recompilación)
5. README para creadores explicando el proceso

---

## Parte 6: Consideraciones Técnicas

### Tamaño del Paquete Final

```
CyBPlayer.exe (Windows)     ~8-15 MB (Tauri usa WebView del sistema)
CyBPlayer (Linux AppImage)  ~12-20 MB
CyBPlayer.app (macOS)       ~10-15 MB

game.cyb                     Variable según assets del juego
                             Solo JSONs: ~50-200 KB
                             Con imágenes: 5-50 MB
                             Con audio: 20-200 MB

ZIP total típico:            ~25-60 MB
```

### Comparación con Electron

| | Tauri | Electron |
|--|-------|----------|
| Tamaño base | ~8 MB | ~150 MB |
| RAM en uso | ~30-50 MB | ~150-300 MB |
| WebView | Sistema (Edge/WebKitGTK) | Chromium embebido |
| Backend | Rust | Node.js |
| Startup | ~0.5s | ~2-3s |

### Requisitos del Sistema del Jugador

**Windows:**
- Windows 10+ (WebView2 incluido)
- Windows 7-8: necesita instalar WebView2 Runtime

**Linux:**
- WebKitGTK instalado (viene en la mayoría de distros)
- libayatana-appindicator (opcional)

**macOS:**
- macOS 10.15+ (Catalina)
- WebKit incluido en el sistema

### Monorepo vs Código Duplicado

**Opción A: Monorepo con workspace** (recomendado a futuro)
```
Calabosos-y-Baboso/
├── packages/
│   ├── engine/          ← Motor compartido
│   ├── components/      ← Componentes compartidos
│   ├── types/           ← Tipos compartidos
│   ├── web-editor/      ← Editor web
│   └── tauri-player/    ← Player ejecutable
```

**Opción B: Copiar código** (pragmático para empezar)
- Copiar los archivos del motor a cyb-player/
- Mantener sincronizado manualmente
- Más rápido de implementar, más tedioso de mantener

**Recomendación:** Empezar con **Opción B** (copiar), migrar a **Opción A** cuando el proyecto madure.

---

## Parte 7: Diagrama de Flujo Completo

```
CREADOR                          JUGADOR
────────                         ───────

┌──────────────┐
│ Editor Web   │
│ Crea juego   │
│ con escenas, │
│ diálogos,    │
│ assets...    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Click        │
│ "Exportar    │
│ Ejecutable"  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Seleccionar  │
│ plataforma:  │
│ Win/Lin/Mac  │
└──────┬───────┘
       │
       ├─► packCyb()
       │   ├─ Serializar JSONs
       │   ├─ Recolectar assets
       │   ├─ Crear ZIP en memoria
       │   ├─ Generar clave XOR
       │   ├─ Cifrar ZIP
       │   └─ Escribir header .cyb
       │
       ├─► Descargar binario pre-compilado
       │   (desde CDN / GitHub Releases)
       │
       ├─► Crear ZIP final
       │   ├─ MiJuego/CyBPlayer.exe
       │   └─ MiJuego/data/game.cyb
       │
       ▼
┌──────────────┐
│ Descarga     │──────────────────────►  ┌──────────────┐
│ MiJuego.zip  │     (distribuye)        │ Descarga     │
└──────────────┘                         │ MiJuego.zip  │
                                         └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ Descomprime  │
                                         │ Doble click  │
                                         │ CyBPlayer    │
                                         └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ Tauri lee    │
                                         │ game.cyb     │
                                         │ descifra     │
                                         │ descomprime  │
                                         │ sirve assets │
                                         └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │   JUEGA!     │
                                         └──────────────┘
```

---

## Parte 8: Orden de Trabajo Sugerido

| # | Tarea | Dependencia | Esfuerzo |
|---|-------|-------------|----------|
| 1 | Implementar `cybFormat.ts` (pack/unpack) | Ninguna | Bajo |
| 2 | Test de cybFormat (pack → unpack → verificar) | 1 | Bajo |
| 3 | Crear proyecto Tauri base (`cyb-player/`) | Ninguna | Medio |
| 4 | Implementar `cyb_loader.rs` | 1 | Medio |
| 5 | Implementar protocolo custom `cyb://` | 4 | Medio |
| 6 | Copiar frontend del motor a cyb-player | 3 | Bajo |
| 7 | Modificar GameLoader para `cyb://` | 5, 6 | Bajo |
| 8 | Crear PlayerApp.tsx simplificado | 6 | Bajo |
| 9 | Testing local: crear .cyb manual → ejecutar player | 1-8 | Medio |
| 10 | Compilar binarios para Win/Lin/Mac | 9 | Medio |
| 11 | Subir binarios a GitHub Releases | 10 | Bajo |
| 12 | Añadir botón "Exportar Ejecutable" al editor | 1, 11 | Medio |
| 13 | Testing end-to-end completo | Todo | Alto |

**Estimación total: Las fases 1-2 se pueden hacer rápido. La fase 3 (Tauri) es el grueso del trabajo.**

---

## Parte 9: Futuro

### Mejoras Posteriores

1. **Icono personalizado**: El creador sube un icono y se embebe en el .cyb. El player lo lee y cambia el icono de la ventana dinámicamente.

2. **Splash screen**: Imagen de carga personalizable antes de que arranque el motor.

3. **Auto-update del player**: Si hay nueva versión del motor, el creador regenera el ejecutable.

4. **Cifrado AES**: Reemplazar XOR por AES-256 para mayor seguridad (cambiar version a 2 en el header).

5. **Múltiples juegos en un player**: Soporte para cargar varios `.cyb` desde una carpeta.

6. **Guardado en archivo**: Exportar/importar partidas guardadas como archivo `.cybsave`.

7. **Modo portable**: Todo autocontenido sin escribir nada fuera de su carpeta.

8. **Compilación nativa de assets**: Convertir imágenes a WebP y audio a Opus durante el empaquetado para reducir tamaño.
