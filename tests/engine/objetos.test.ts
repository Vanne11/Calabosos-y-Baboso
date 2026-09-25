// Paso use_item: usar un objeto del inventario sobre un objetivo.

import { describe, it, expect } from 'vitest';
import { baseManifest, makeEngine, drive, internals } from '../helpers';

const scenes = {
  puerta: {
    sequence: [{
      type: 'use_item' as const,
      description: 'Una puerta cerrada y un guardia dormido.',
      targets: [
        { id: 'puerta', label: 'la puerta', accepts: [{ itemId: 'llave', text: 'Se abre.', goto: 'dentro' }] },
        { id: 'guardia', label: 'el guardia', accepts: [{ itemId: 'sal', text: 'Estornuda.', effects: { flags: { guardia_despierto: true } } }] },
      ],
    }],
  },
  dentro: { sequence: [] },
};

describe('use_item', () => {
  it('gasta una sola unidad del objeto usado', async () => {
    const engine = makeEngine(baseManifest({}), scenes);
    internals(engine)._state.inventory = ['sal', 'sal', 'llave'];
    await drive(engine, 'puerta', [{ type: 'use_item_on', itemId: 'sal', targetId: 'guardia' }]);
    expect(engine.state.inventory).toEqual(['sal', 'llave']);
    expect(engine.state.flags.guardia_despierto).toBe(true);
  });

  it('un objeto que no sirve no se gasta y se vuelve a preguntar; uno que sirve navega', async () => {
    const engine = makeEngine(baseManifest({}), scenes);
    internals(engine)._state.inventory = ['sal', 'llave'];
    const out = await drive(engine, 'puerta', [
      { type: 'use_item_on', itemId: 'sal', targetId: 'puerta' },
      { type: 'use_item_on', itemId: 'llave', targetId: 'puerta' },
    ]);
    expect(out.filter((r) => r.type === 'use_item_prompt')).toHaveLength(2);
    expect(out.find((r) => r.type === 'use_item_result')).toMatchObject({ success: false });
    expect(out[out.length - 1]).toMatchObject({ type: 'navigate', scene: 'dentro' });
    expect(engine.state.inventory).toEqual(['sal']);
  });
});
