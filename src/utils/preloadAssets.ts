// utils/preloadAssets.ts
// Precarga de imágenes y audio del juego demo durante el boot

import { assetUrl } from './assetUrl';

const DEMO_BASE = 'games/demo';

const IMAGES = [
  'images/scenarios/intro.png',
  'images/scenarios/plaza.png',
  'images/scenarios/establos.png',
  'images/scenarios/casa_empenos.png',
  'images/scenarios/mercado.png',
  'images/scenarios/tienda.png',
  'images/scenarios/callejon.png',
  'images/scenarios/entrada_abismo.png',
  'images/scenarios/sala_entrada.png',
  'images/scenarios/grutas_cristal.png',
  'images/scenarios/final.png',
  'images/dialogs/narrator.png',
  'images/dialogs/protagonist_male.png',
  'images/dialogs/protagonist_female.png',
  'images/dialogs/protagonist_andro.png',
  'images/dialogs/tendero.png',
  'images/dialogs/nerly.png',
  'images/dialogs/noble.png',
  'images/dialogs/dueno_establos.png',
  'images/dialogs/prestamista.png',
  'images/dialogs/anciano.png',
  'images/dialogs/system.png',
  'images/items/bolsa_monedas.png',
  'images/items/espada_oxidada.png',
  'images/items/sal_anti_babosas.png',
  'images/items/zurron_espacioso.png',
];

const AUDIO = [
  'audio/rpgchip02_bittersweet_story.ogg',
  'audio/rpgchip03_town.ogg',
  'audio/rpgchip04_in_the_royal_court.ogg',
  'audio/rpgchip05_pavane.ogg',
  'audio/rpgchip06_dungeon.ogg',
  'audio/rpgchip07_the_shrine_of_mysteries.ogg',
  'audio/rpgchip08_castle_on_the_mountain.ogg',
  'audio/rpgchip09_rainy_streets.ogg',
  'audio/rpgchip10_fountain_of_the_fairies.ogg',
  'audio/rpgchip12_the_evil_one.ogg',
];

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // no bloquear por errores
    img.src = src;
  });
}

function preloadAudio(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.oncanplaythrough = () => resolve();
    audio.onerror = () => resolve();
    audio.src = src;
  });
}

export function preloadDemoAssets(
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const allAssets = [
    ...IMAGES.map((p) => () => preloadImage(assetUrl(`${DEMO_BASE}/${p}`))),
    ...AUDIO.map((p) => () => preloadAudio(`${DEMO_BASE}/${p}`)),
  ];

  const total = allAssets.length;
  let loaded = 0;

  return Promise.all(
    allAssets.map((load) =>
      load().then(() => {
        loaded++;
        onProgress?.(loaded, total);
      })
    )
  ).then(() => {});
}
