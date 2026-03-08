// editor/data/sceneTemplates.ts
// Templates predefinidos para crear escenas rápidamente

import type { Scene } from '../../types/game';

export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  scene: Scene;
}

export const sceneTemplates: SceneTemplate[] = [
  {
    id: 'dialog_simple',
    name: 'Diálogo simple',
    description: 'Narrador + opciones básicas',
    scene: {
      scenario: { name: 'Nueva Escena', description: 'Descripción...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['...'] },
        { type: 'choice', options: [{ text: 'Continuar', goto: '' }] },
      ],
    },
  },
  {
    id: 'combat_dice',
    name: 'Combate con dado',
    description: 'Tirada de dado con éxito/fallo',
    scene: {
      scenario: { name: 'Combate', description: 'Un enemigo aparece...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['¡Un enemigo aparece!'] },
        {
          type: 'dice',
          stat: 'will_to_live',
          difficulty: 12,
          faces: 20,
          description: 'Tirada de combate',
          results: {
            success: { text: '¡Victoria!', goto: '' },
            failure: { text: 'Has caído...', goto: '' },
          },
        },
      ],
    },
  },
  {
    id: 'multi_choice',
    name: 'Decisión múltiple',
    description: '3 opciones con destinos diferentes',
    scene: {
      scenario: { name: 'Encrucijada', description: 'Varios caminos se abren ante ti...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['¿Qué camino eliges?'] },
        {
          type: 'choice',
          options: [
            { text: 'Opción A', goto: '' },
            { text: 'Opción B', goto: '' },
            { text: 'Opción C', goto: '' },
          ],
        },
      ],
    },
  },
  {
    id: 'shop',
    name: 'Tienda',
    description: 'Diálogo + opciones con efectos de inventario',
    scene: {
      scenario: { name: 'Tienda', description: 'Un comerciante te mira expectante...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['Bienvenido a mi tienda.'] },
        {
          type: 'choice',
          options: [
            { text: 'Comprar poción', goto: '', effects: { inventory: ['pocion'] } },
            { text: 'Salir', goto: '' },
          ],
        },
      ],
    },
  },
  {
    id: 'checkpoint',
    name: 'Punto de control',
    description: 'Efectos de curación + continuar',
    scene: {
      scenario: { name: 'Descanso', description: 'Un lugar seguro para descansar...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['Recuperas fuerzas.'] },
        { type: 'effects', effects: { stats: { will_to_live: 20 } } },
        { type: 'choice', options: [{ text: 'Continuar', goto: '' }] },
      ],
    },
  },
  {
    id: 'conditional',
    name: 'Escena condicional',
    description: 'Diálogos con condiciones + input',
    scene: {
      scenario: { name: 'Encuentro', description: 'Alguien te espera...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['¿Quién eres?'] },
        { type: 'input', prompt: '¿Cómo te llamas?', saveAs: 'player_name', goto: '' },
      ],
    },
  },
  {
    id: 'random_encounter',
    name: 'Encuentro aleatorio',
    description: 'Evento aleatorio con múltiples resultados',
    scene: {
      scenario: { name: 'Camino', description: 'Algo sucede en el camino...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['Mientras caminas...'] },
        {
          type: 'random',
          outcomes: [
            { weight: 3, text: 'Encuentras una moneda en el suelo.', effects: { stats: { dinero: 5 } } },
            { weight: 2, text: 'Una brisa agradable te refresca.', effects: { stats: { will_to_live: 5 } } },
            { weight: 1, text: 'Una babosa te embosca!', goto: '' },
          ],
        },
        { type: 'choice', options: [{ text: 'Continuar', goto: '' }] },
      ],
    },
  },
  {
    id: 'shop_full',
    name: 'Tienda completa',
    description: 'Interfaz de tienda con compra/venta',
    scene: {
      scenario: { name: 'Tienda', description: 'Estantes llenos de objetos curiosos...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['Bienvenido a mi humilde tienda.'] },
        {
          type: 'shop',
          title: 'Tienda del Aventurero',
          currency: 'dinero',
          items: [
            { id: 'pocion_salud', name: 'Poción de Salud', price: 15, description: 'Restaura 30 de vida' },
            { id: 'sal_anti_babosas', name: 'Sal Anti-Babosas', price: 25, description: 'Útil contra babosas' },
          ],
          sellable: true,
          sellRatio: 0.5,
          goto: '',
        },
      ],
    },
  },
  {
    id: 'combat_full',
    name: 'Combate completo',
    description: 'Combate por turnos con HP del enemigo',
    scene: {
      scenario: { name: 'Combate', description: 'Un enemigo bloquea el camino...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['¡Prepárate para luchar!'] },
        {
          type: 'combat',
          enemy: { name: 'Babosa Gigante', hp: 40, attack: 6, defense: 2 },
          playerStat: 'will_to_live',
          attackStat: 'reputation',
          actions: ['attack', 'defend', 'flee'],
          results: {
            victory: { text: '¡Has derrotado a la babosa!', effects: { stats: { reputation: 10 } }, goto: '' },
            defeat: { text: 'La babosa te ha vencido...', goto: '' },
            flee: { text: 'Huyes cobardemente.', effects: { stats: { reputation: -5 } }, goto: '' },
          },
        },
      ],
    },
  },
  {
    id: 'boss_fight',
    name: 'Boss con fases',
    description: 'Combate de boss con items usables (encadena con más escenas para fases)',
    scene: {
      scenario: { name: 'Boss', description: 'Un enemigo terrible se alza ante ti...' },
      sequence: [
        { type: 'wait', text: 'El suelo tiembla...', duration: 2000, style: 'dots' as const },
        { type: 'dialog', character: 'narrator', lines: [
          '¡El Rey Baboso aparece!',
          'Su cuerpo viscoso brilla con una luz enfermiza.',
          'Más vale que tengas algo útil en tu inventario...',
        ] },
        {
          type: 'combat',
          enemy: { name: 'Rey Baboso', hp: 80, attack: 10, defense: 5 },
          playerStat: 'will_to_live',
          attackStat: 'reputation',
          defenseStat: 'fear',
          actions: ['attack', 'defend', 'flee', 'use_item'],
          combatItems: [
            {
              itemId: 'sal_anti_babosas',
              name: 'Sal Anti-Babosas',
              text: '¡Lanzas sal al Rey Baboso! Su piel burbujea y aúlla de dolor.',
              damage: 30,
              consume: true,
            },
            {
              itemId: 'pocion_salud',
              name: 'Poción de Salud',
              text: 'Bebes la poción rápidamente.',
              heal: 25,
              consume: true,
            },
          ],
          results: {
            victory: { text: '¡El Rey Baboso cae derrotado! Su corona viscosa rueda por el suelo.', effects: { stats: { reputation: 25 }, flags: { boss_defeated: true } }, goto: '' },
            defeat: { text: 'El Rey Baboso te consume con su baba... Viscaria está perdida.', goto: '' },
            flee: { text: 'Huyes del Rey Baboso. Vivirás para luchar otro día... cobarde.', effects: { stats: { reputation: -15 } }, goto: '' },
          },
        },
      ],
    },
  },
  {
    id: 'puzzle_combat',
    name: 'Combate de ingenio',
    description: 'Estilo Monkey Island: resolver con opciones e inventario, no con fuerza',
    scene: {
      scenario: { name: 'Enfrentamiento', description: 'Tu enemigo te bloquea el paso...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: [
          'La Babosa Guardiana te mira fijamente.',
          'No parece que la fuerza bruta vaya a funcionar aquí...',
        ] },
        {
          type: 'choice',
          options: [
            {
              text: 'Lanzar sal (si tienes)',
              condition: { inventory: ['sal_anti_babosas'] },
              effects: { removeInventory: ['sal_anti_babosas'], flags: { guardian_defeated: true } },
              goto: '',
            },
            {
              text: 'Intentar pasar sigilosamente',
              condition: { stats: { reputation: '>=60' } },
              goto: '',
            },
            {
              text: 'Hablar con la babosa',
              goto: '',
            },
            {
              text: 'Buscar otra ruta',
              goto: '',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'skill_check',
    name: 'Prueba de habilidad',
    description: 'Comprobación automática de stat',
    scene: {
      scenario: { name: 'Obstáculo', description: 'Algo bloquea tu camino...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['¿Serás capaz de superar esto?'] },
        {
          type: 'check',
          stat: 'will_to_live',
          threshold: '>=60',
          description: 'Comprobación de voluntad',
          success: { text: '¡Tu determinación te lleva adelante!', goto: '' },
          failure: { text: 'No tienes suficiente voluntad...', goto: '' },
        },
      ],
    },
  },
  {
    id: 'cinematic',
    name: 'Escena cinemática',
    description: 'Pausa + sonido + diálogo + notificación',
    scene: {
      scenario: { name: 'Revelación', description: 'El ambiente cambia...' },
      sequence: [
        { type: 'wait', text: 'La oscuridad se cierne...', duration: 2000, style: 'dots' as const },
        { type: 'dialog', character: 'narrator', lines: ['Algo terrible se aproxima.', 'Puedes sentirlo en el aire.'] },
        { type: 'notify', style: 'discovery' as const, title: 'Descubrimiento', text: 'Has desbloqueado una nueva zona.' },
        { type: 'choice', options: [{ text: 'Continuar', goto: '' }] },
      ],
    },
  },
  {
    id: 'branch_narrative',
    name: 'Bifurcación narrativa',
    description: 'Redirige según condiciones del jugador',
    scene: {
      scenario: { name: 'Cruce de caminos' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['Tu destino se define...'] },
        {
          type: 'branch',
          branches: [
            { condition: { flags: { has_key: true } }, goto: '' },
            { condition: { stats: { reputation: '>=70' } }, goto: '' },
            { goto: '' },
          ],
        },
      ],
    },
  },
  {
    id: 'puzzle_room',
    name: 'Habitación de puzzle',
    description: 'Examinar entorno + usar item en objetivo',
    scene: {
      scenario: { name: 'Habitación misteriosa', description: 'Una sala llena de mecanismos extraños...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['La puerta se cierra detrás de ti.', 'Tendrás que encontrar la forma de salir.'] },
        {
          type: 'examine',
          description: 'Examinas la habitación...',
          subjects: [
            { id: 'mesa', label: 'La mesa de piedra', text: 'Sobre la mesa hay una llave oxidada.', effects: { inventory: ['llave_oxidada'] }, oneTime: true },
            { id: 'mural', label: 'El mural en la pared', text: 'El mural muestra una cerradura con forma de estrella. Curioso.' },
            { id: 'suelo', label: 'Las baldosas del suelo', text: 'Algunas baldosas están flojas, pero no puedes moverlas.' },
          ],
          exitText: 'Dejar de mirar',
        },
        {
          type: 'use_item',
          description: 'Hay una cerradura en la puerta norte.',
          targets: [
            {
              id: 'cerradura',
              label: 'La cerradura de la puerta',
              accepts: [
                { itemId: 'llave_oxidada', text: '¡La llave encaja! La puerta se abre con un chirrido.', consume: true, goto: '' },
              ],
              defaultText: 'Eso no encaja en la cerradura.',
            },
          ],
          failText: 'No tienes nada útil para eso.',
          exitText: 'Dejar la puerta',
        },
      ],
    },
  },
  {
    id: 'riddle_guardian',
    name: 'Acertijo del guardián',
    description: 'Un guardián que hace un acertijo para pasar',
    scene: {
      scenario: { name: 'El Guardián', description: 'Una figura encapuchada bloquea el paso...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['El Guardián alza la mano.', '"Solo los dignos pueden pasar."'] },
        {
          type: 'puzzle',
          puzzleType: 'riddle',
          description: 'El Guardián te hace un acertijo...',
          config: {
            type: 'riddle',
            question: 'No tengo pies, pero puedo viajar. No tengo boca, pero cuento historias. ¿Qué soy?',
            answers: ['libro', 'un libro', 'el libro'],
            hint: 'Piensa en algo que guardas en una estantería.',
          },
          maxAttempts: 3,
          success: { text: '"¡Correcto! Puedes pasar, viajero."', effects: { flags: { guardian_passed: true } }, goto: '' },
          failure: { text: '"Incorrecto. Vuelve cuando seas más sabio."', goto: '' },
        },
      ],
    },
  },
  {
    id: 'combination_lock',
    name: 'Cerradura combinada',
    description: 'Examinar para encontrar pista + candado numérico',
    scene: {
      scenario: { name: 'La Caja Fuerte', description: 'Una caja fuerte antigua con un candado de 3 dígitos...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['Una caja fuerte. Necesitas la combinación.'] },
        {
          type: 'examine',
          description: 'Buscas pistas en los alrededores...',
          subjects: [
            { id: 'nota', label: 'Un papel arrugado', text: 'Dice: "Mi cumpleaños: 7 de abril de 2..." El resto está borroso.', effects: { flags: { pista_nota: true } }, oneTime: true },
            { id: 'calendario', label: 'El calendario en la pared', text: 'El día 7 del mes 4 está marcado con un círculo. Año 42.', effects: { flags: { pista_calendario: true } }, oneTime: true },
          ],
          exitText: 'Intentar abrir la caja',
        },
        {
          type: 'puzzle',
          puzzleType: 'lock',
          description: 'Introduces la combinación del candado...',
          config: { type: 'lock', digits: 3, combination: '742', hint: 'Las pistas están en la habitación.' },
          maxAttempts: 5,
          success: { text: '¡Click! La caja se abre revelando su contenido.', effects: { inventory: ['tesoro'] }, goto: '' },
          failure: { text: 'El candado se bloquea. Ya no puedes abrirlo.', goto: '' },
        },
      ],
    },
  },
  {
    id: 'crafting_adventure',
    name: 'Crafteo de aventura',
    description: 'Encontrar ingredientes + combinarlos',
    scene: {
      scenario: { name: 'El Taller', description: 'Un taller abandonado con herramientas oxidadas...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['El taller tiene todo lo necesario para crear algo útil.', 'Solo necesitas los materiales correctos.'] },
        {
          type: 'examine',
          description: 'Revisas el taller...',
          subjects: [
            { id: 'estante', label: 'El estante de materiales', text: 'Encuentras un trozo de cuerda resistente.', effects: { inventory: ['cuerda'] }, oneTime: true },
            { id: 'caja', label: 'La caja de herramientas', text: 'Dentro hay un garfio metálico.', effects: { inventory: ['garfio'] }, oneTime: true },
            { id: 'planos', label: 'Los planos en la mesa', text: 'Los planos muestran cómo combinar una cuerda con un garfio para crear un gancho de escalada.' },
          ],
          exitText: 'Ir a la mesa de trabajo',
        },
        {
          type: 'craft',
          description: 'Combina objetos en la mesa de trabajo.',
          recipes: [
            { ingredients: ['cuerda', 'garfio'], result: 'gancho_escalada', text: '¡Has creado un gancho de escalada! Ahora puedes subir al siguiente nivel.', consume: true, goto: '' },
          ],
          failText: 'Intentas combinar las cosas pero no tiene sentido. El narrador suspira.',
        },
      ],
    },
  },
  {
    id: 'pressure_decision',
    name: 'Decisión bajo presión',
    description: 'Elección con temporizador en momento tenso',
    scene: {
      scenario: { name: 'El Derrumbe', description: 'Las paredes empiezan a temblar...' },
      sequence: [
        { type: 'wait', text: 'El techo cruje amenazadoramente...', duration: 2000, style: 'dots' as const },
        { type: 'dialog', character: 'narrator', lines: ['¡La cueva se derrumba! ¡DECIDE RÁPIDO!'] },
        {
          type: 'timed_choice',
          duration: 8000,
          defaultIndex: 2,
          timeoutText: '¡Demasiado lento! Las rocas te atrapan.',
          options: [
            { text: 'Saltar al agujero de la izquierda', goto: '', effects: { stats: { will_to_live: -10 } } },
            { text: 'Correr hacia la salida', goto: '', effects: { stats: { will_to_live: -5 } } },
            { text: 'Quedarte paralizado de miedo', goto: '', effects: { stats: { will_to_live: -30 } } },
          ],
        },
      ],
    },
  },
  {
    id: 'multi_puzzle',
    name: 'Puzzle secuencial',
    description: 'Secuencia de palancas en orden correcto',
    scene: {
      scenario: { name: 'La Sala de las Palancas', description: 'Cuatro palancas oxidadas adornan la pared...' },
      sequence: [
        { type: 'dialog', character: 'narrator', lines: ['Las palancas tienen símbolos grabados.', '"Sol, Luna, Estrella, Nube"', 'El orden correcto abrirá la puerta secreta.'] },
        {
          type: 'puzzle',
          puzzleType: 'sequence',
          description: 'Tira las palancas en el orden correcto.',
          config: {
            type: 'sequence',
            elements: [
              { id: 'luna', label: 'Luna' },
              { id: 'sol', label: 'Sol' },
              { id: 'nube', label: 'Nube' },
              { id: 'estrella', label: 'Estrella' },
            ],
            hint: 'El poema en la pared dice: "Primero la luna alumbra, luego el sol calienta, las nubes cubren, y la estrella guía."',
          },
          maxAttempts: 0,
          success: { text: '¡Las palancas encajan! Un mecanismo se activa y la puerta se abre.', effects: { flags: { sala_palancas: true } }, goto: '' },
          failure: { text: 'Las palancas se reinician. Prueba de nuevo.', goto: '' },
        },
      ],
    },
  },
];
