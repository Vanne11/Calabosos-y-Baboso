// editor/utils/assetStorage.ts
// Almacenamiento de assets en LocalForage como blobs

import localforage from 'localforage';

const assetStore = localforage.createInstance({
  name: 'cyb-editor-assets',
});

export async function saveAsset(projectId: string, filename: string, blob: Blob): Promise<string> {
  const key = `${projectId}/${filename}`;
  await assetStore.setItem(key, blob);
  return key;
}

export async function loadAsset(key: string): Promise<Blob | null> {
  return assetStore.getItem<Blob>(key);
}

export async function loadAssetUrl(key: string): Promise<string | null> {
  const blob = await loadAsset(key);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function deleteAsset(key: string): Promise<void> {
  await assetStore.removeItem(key);
}

export async function listProjectAssets(projectId: string): Promise<string[]> {
  const keys: string[] = [];
  await assetStore.iterate((_, key) => {
    if (key.startsWith(`${projectId}/`)) {
      keys.push(key);
    }
  });
  return keys;
}

export async function exportAllAssets(projectId: string): Promise<Map<string, Blob>> {
  const assets = new Map<string, Blob>();
  await assetStore.iterate<Blob, void>((blob, key) => {
    if (key.startsWith(`${projectId}/`)) {
      const filename = key.slice(projectId.length + 1);
      assets.set(filename, blob);
    }
  });
  return assets;
}
