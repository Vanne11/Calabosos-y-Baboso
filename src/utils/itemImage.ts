// utils/itemImage.ts
// Imagen de un objeto: la de game.json → items[id].image (el arte puede llamarse distinto que el id,
// ej. "sal" → "images/items/sal_anti_babosas.png"); si no tiene, images/items/<id>.png.

import { useAppStore } from '../store/useAppStore';
import { assetUrl } from './assetUrl';

export function itemImageUrl(id: string): string {
  const { engine, gameBasePath } = useAppStore.getState();
  const rel = engine?.items?.[id]?.image ?? `images/items/${id}.png`;
  return assetUrl(rel.startsWith(gameBasePath) ? rel : `${gameBasePath}/${rel}`);
}
