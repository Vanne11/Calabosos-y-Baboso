// scripts/sfx-names.ts
// Regenera src/audio/sfx-names.json (lista de efectos y ambientes que usa el validador)
// a partir del catálogo real. Uso: npm run sfx-names

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SFX } from '../src/audio/sfxCatalog';
import { AMBIENCES } from '../src/audio/ambience';
import { TONES } from '../src/engine/AiProvider';

const out = {
  _comment: 'Generado con `npm run sfx-names` desde src/audio (sfxCatalog.ts y ambience.ts). Lo usa el validador.',
  sfx: Object.keys(SFX).sort(),
  ambience: Object.keys(AMBIENCES).sort(),
  tones: [...TONES],
};
const path = resolve(process.cwd(), 'src', 'audio', 'sfx-names.json');
writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
console.log(`✔ ${out.sfx.length} efectos, ${out.ambience.length} ambientes, ${out.tones.length} tonos → src/audio/sfx-names.json`);
