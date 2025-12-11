# Problemas con el Flujo Secuencial del Motor

## Fecha: 2025-12-11

## Problema Principal

El motor web no maneja correctamente el flujo secuencial de acciones (escenarios → diálogos → widgets). Todo se ejecuta de forma caótica y desordenada.

## Síntomas Observados

Al ejecutar `run demo`, los mensajes aparecen en este orden incorrecto:

```
¡Juego cargado correctamente!
Iniciando Calabosos y Babosos - Demo Completa...
Prepárate para tomar decisiones terribles.

¡Por fin! Pensé que tendría que recitar toda la introducción yo solo. Necesitamos a alguien que protagonice esta historia y parece que ese alguien eres tú.
Primero lo primero: ¿Cuál es tu género? Como si realmente importara...
═══════════════════════════════════════════
📍 Introducción
═══════════════════════════════════════════
El comienzo de tu aventura en Viscaria
narrator
Desde tiempos inmemoriales, el Reino de Viscaria ha vivido aterrorizado por las criaturas que habitan el Abismo de las Babosas, una mazmorra tan profunda y retorcida como... eh, ¿estás prestando atención?
¡Por fin! Pensé que tendría que recitar toda la introducción yo solo. Necesitamos a alguien que protagonice esta historia y parece que ese alguien eres tú.
[1] Masculino[2] Femenino[3] No binario[4] Otro
```

**Problemas visibles:**
1. Los mensajes del diálogo aparecen ANTES del escenario (debería ser al revés)
2. Los mensajes del diálogo están duplicados
3. Los botones aparecen sin esperar a que termine el diálogo
4. Los botones no tienen espaciado entre ellos

## Orden Esperado vs Orden Real

### Orden Esperado:
```
1. Escenario (con título y descripción)
2. Nombre del personaje (narrator)
3. Primera línea del diálogo → Usuario presiona Enter
4. Segunda línea del diálogo → Usuario presiona Enter
5. Tercera línea del diálogo → Usuario presiona Enter
6. Botones de opciones aparecen (con espaciado correcto)
```

### Orden Real:
```
1. Todas las líneas del diálogo aparecen INMEDIATAMENTE
2. Escenario aparece DESPUÉS (aunque se procesa primero)
3. Header del diálogo aparece
4. Primera línea del diálogo aparece (duplicada)
5. Botones aparecen SIN ESPERAR
```

## Raíz del Problema

### 1. Procesamiento Asíncrono Mal Implementado

**Ubicación:** `Terminal.jsx` línea ~217-309 (useEffect de procesamiento de rutas)

```javascript
const processCurrentRoute = async () => {
  const route = gameData.routes.find(r => r.id === currentRoute);

  for (const actionId of route.actions) {
    const scenario = getScenarioById(actionId, gameData.scenarios);
    if (scenario) {
      // Se ejecuta SÍNCRONAMENTE (inmediato)
      addSystemMessage(...);
      continue;
    }

    const dialog = findDialogById(actionId, gameData.dialogs);
    if (dialog) {
      await showDialog(dialog); // Intenta esperar pero NO FUNCIONA
      continue;
    }

    const widget = findWidgetById(actionId, gameData.widgets);
    if (widget) {
      setCurrentOptions(widget); // Se ejecuta INMEDIATAMENTE
      break;
    }
  }
};
```

**Problema:** Aunque usa `async/await`, la Promise de `showDialog()` no se resuelve correctamente, así que el código continúa sin esperar.

### 2. Promise de showDialog() No Funciona Correctamente

**Ubicación:** `Terminal.jsx` línea ~326-385 (función showDialog)

```javascript
const showDialog = async (dialog) => {
  // ... código de setup ...

  // Muestra solo la PRIMERA línea
  setHistory(prev => [...prev, {
    type: 'dialog',
    content: firstLine
  }]);

  if (validLines.length > 1) {
    setCurrentDialogIndex(1);
  }

  // Intenta crear una Promise que se resuelve cuando currentDialog es null
  if (validLines.length > 1) {
    return new Promise(resolve => {
      dialogCompleteResolve.current = resolve;
    });
  }
};
```

**Problemas:**
- La Promise se crea pero depende de que `dialogCompleteResolve.current()` se llame en `continueDialog()`
- El estado de React es asíncrono, causando race conditions
- No hay garantía de que la Promise se resuelva en el orden correcto

### 3. Estados de React Causan Re-renders Caóticos

Cuando se ejecuta una ruta:
1. `setHistory()` se llama múltiples veces → re-render
2. `setCurrentDialog()` se llama → re-render
3. `setCurrentOptions()` se llama → re-render
4. Cada re-render puede ejecutar el useEffect de nuevo
5. `isProcessingRoute` no previene correctamente la re-ejecución

### 4. El useEffect se Re-ejecuta Múltiples Veces

**Ubicación:** `Terminal.jsx` línea ~217

```javascript
useEffect(() => {
  if (!gameData || !currentRoute || !setGameState) return;
  if (isProcessingRoute) return; // Esto NO previene todos los casos

  setIsProcessingRoute(true);
  // ... procesamiento ...
}, [currentRoute, gameData, setGameState, isProcessingRoute]);
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//  Estas dependencias causan que el efecto se ejecute múltiples veces
```

**Problema:** El array de dependencias incluye `isProcessingRoute`, lo que causa un loop:
- Se establece `isProcessingRoute = true`
- Esto cambia una dependencia
- El useEffect se ejecuta de nuevo
- Detecta `isProcessingRoute = true` y sale temprano
- Pero ya causó efectos secundarios

## Intentos de Solución Fallidos

### Intento 1: Widget tipo "form" con campos HTML
- **Problema:** No tiene sentido en una terminal basada en texto
- **Resultado:** El formulario no se renderizaba o no era visible

### Intento 2: Usar ref `dialogCompleteResolve` para resolver Promise
- **Problema:** Los estados de React causan timing issues
- **Resultado:** La Promise no se resuelve en el momento correcto

### Intento 3: Agregar guards con `isProcessingRoute`
- **Problema:** El array de dependencias del useEffect causa re-ejecuciones
- **Resultado:** El código se ejecuta múltiples veces de todos modos

### Intento 4: Limpiar `currentOptions` solo al final
- **Problema:** No resuelve el problema del orden de ejecución
- **Resultado:** Los widgets aparecen pero en el momento incorrecto

## Solución Real Necesaria

### Opción A: Refactorizar Completamente el Sistema de Procesamiento de Rutas

**Cambios necesarios:**

1. **Implementar una máquina de estados** para el procesamiento de acciones:
   ```
   IDLE → PROCESSING_SCENARIO → PROCESSING_DIALOG → PROCESSING_WIDGET → IDLE
   ```

2. **Usar una cola de acciones** en lugar de un loop:
   ```javascript
   const [actionQueue, setActionQueue] = useState([]);
   const [currentAction, setCurrentAction] = useState(null);

   // Procesar una acción a la vez
   // Solo pasar a la siguiente cuando la actual termine
   ```

3. **Hacer que showDialog() sea verdaderamente bloqueante**:
   - No continuar hasta que el usuario haya presionado Enter en TODAS las líneas
   - Usar un sistema de eventos o callbacks en lugar de Promises

4. **Separar el useEffect de procesamiento de rutas**:
   - Un useEffect para detectar cambio de ruta → llenar cola
   - Otro useEffect para procesar la cola → una acción a la vez

### Opción B: Simplificar el Flujo (Más Rápido)

**Cambios mínimos:**

1. **Eliminar el flujo de preguntas personalizadas**:
   - Volver a un solo botón "Iniciar" después de la intro
   - El narrador simplemente te llama "BOB" sin preguntar

2. **No intentar capturar nombre/género**:
   - Es contenido opcional que complica el flujo
   - Se puede agregar después cuando el motor esté más maduro

3. **Mantener solo widgets de tipo "button"**:
   - Ya funcionan correctamente en el resto del juego
   - No agregar nuevos tipos hasta resolver el problema de sincronización

### Opción C: Usar un Sistema de Comandos Diferente

En lugar de procesar todo automáticamente:

1. **Mostrar el escenario inmediatamente**
2. **Esperar comando del usuario**: `next` o presionar Enter
3. **Mostrar siguiente línea de diálogo**
4. **Repetir hasta terminar**
5. **Mostrar opciones**

Este enfoque es más "manual" pero más confiable.

## Archivos Afectados

### Archivos de código:
- `motor_web/src/components/Terminal/Terminal.jsx` (principal)
- `motor_web/src/components/Widgets/FormWidget.jsx` (creado, no funcional)
- `motor_web/src/engine/routeResolver.jsx` (secundario)

### Archivos de datos:
- `motor_web/public/games/demo/routes.json` (modificado)
- `motor_web/public/games/demo/dialogs.json` (modificado)
- `motor_web/public/games/demo/widgets.json` (modificado)

## Recomendación

**Para continuar:**

1. **Hacer un git stash o commit** de los cambios actuales para no perderlos
2. **Volver al estado anterior** (antes de intentar agregar el flujo de nombre/género)
3. **Implementar Opción B (Simplificar)**: Mantener el juego funcional sin el flujo personalizado
4. **En el futuro**, cuando haya más tiempo, implementar Opción A (Refactorizar) correctamente

**No intentar arreglar** el problema actual sin hacer cambios arquitecturales profundos. Es como intentar arreglar un edificio con cimientos débiles: cualquier parche será temporal.

## Aprendizajes

1. **Las Promises y async/await en React son complicadas** cuando se mezclan con estados y useEffects
2. **Los useEffects con muchas dependencias son peligrosos** - causan loops y re-ejecuciones inesperadas
3. **La sincronización de eventos de usuario con procesamiento automático es difícil** sin una arquitectura clara
4. **Es mejor tener menos features funcionando bien** que muchas features a medias

## Estado Actual

- El juego NO funciona correctamente
- Los mensajes aparecen desordenados
- Los diálogos están duplicados
- Los widgets aparecen en el momento incorrecto
- El código tiene múltiples intentos de solución mezclados

**Próximo paso sugerido:** Revertir cambios y volver a un estado funcional.
