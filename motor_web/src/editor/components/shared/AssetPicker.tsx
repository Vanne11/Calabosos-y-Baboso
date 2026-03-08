// editor/components/shared/AssetPicker.tsx
// Upload + preview + galería de assets (imágenes y audio)

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import { saveAsset, listProjectAssets, loadAssetUrl } from '../../utils/assetStorage';

const AUDIO_EXTENSIONS = /\.(mp3|ogg|wav|flac|aac|m4a|webm)$/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i;
const ACCEPTED_FORMATS = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml,audio/mpeg,audio/ogg,audio/wav,audio/flac,audio/aac,audio/mp4,audio/webm';

function isAudioAsset(path: string): boolean {
  return AUDIO_EXTENSIONS.test(path);
}

interface AssetPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Restringir a solo imágenes o solo audio */
  accept?: 'image' | 'audio' | 'all';
}

const AssetPicker: React.FC<AssetPickerProps> = ({ value, onChange, label, accept = 'all' }) => {
  const project = useEditorStore((s) => s.project);
  const [showGallery, setShowGallery] = useState(false);
  const [assets, setAssets] = useState<{ key: string; url: string }[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const projectId = project?.id || '';
  const isAudio = isAudioAsset(value);

  useEffect(() => {
    if (value && value.startsWith('asset:')) {
      loadAssetUrl(value.slice(6)).then((url) => setPreviewUrl(url));
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  // Limpiar audio al desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadGallery = async () => {
    const keys = await listProjectAssets(projectId);
    const items = await Promise.all(
      keys.map(async (key) => {
        const url = await loadAssetUrl(key);
        return { key, url: url || '' };
      })
    );
    // Filtrar por tipo si es necesario
    const filtered = items.filter((a) => {
      const filename = a.key.split('/').pop() || '';
      if (accept === 'image') return IMAGE_EXTENSIONS.test(filename);
      if (accept === 'audio') return AUDIO_EXTENSIONS.test(filename);
      return true;
    });
    setAssets(filtered);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    // Validar tipo MIME
    const isValidImage = file.type.startsWith('image/');
    const isValidAudio = file.type.startsWith('audio/');
    if (!isValidImage && !isValidAudio) {
      alert('Formato no soportado. Usa imágenes (PNG, JPG, GIF, WebP) o audio (MP3, OGG, WAV).');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    if (accept === 'image' && !isValidImage) {
      alert('Solo se aceptan imágenes en este campo.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (accept === 'audio' && !isValidAudio) {
      alert('Solo se acepta audio en este campo.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const key = await saveAsset(projectId, file.name, file);
    onChange(`asset:${key}`);

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleOpenGallery = async () => {
    await loadGallery();
    setShowGallery(true);
  };

  const toggleAudioPreview = () => {
    const src = previewUrl || value;
    if (!src) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
    audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
    audio.play().catch(() => setIsPlaying(false));
    audioRef.current = audio;
    setIsPlaying(true);
  };

  const inputAccept = accept === 'image' ? 'image/*' : accept === 'audio' ? 'audio/*' : ACCEPTED_FORMATS;

  return (
    <Wrapper>
      {label && <Label>{label}</Label>}
      <Row>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={accept === 'audio' ? 'audio/musica.ogg' : '/images/escena.png'}
        />
        <UploadBtn onClick={() => fileRef.current?.click()} title="Subir archivo">
          ^
        </UploadBtn>
        <GalleryBtn onClick={handleOpenGallery} title="Galeria">
          #
        </GalleryBtn>
        {/* Botón de preview de audio */}
        {isAudio && (previewUrl || value) && (
          <AudioBtn onClick={toggleAudioPreview} $playing={isPlaying} title={isPlaying ? 'Detener' : 'Reproducir'}>
            {isPlaying ? '||' : '>'}
          </AudioBtn>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={inputAccept}
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </Row>

      {/* Preview de imagen */}
      {!isAudio && (previewUrl || (value && !value.startsWith('asset:'))) && (
        <Preview>
          <PreviewImg
            src={previewUrl || value}
            alt="preview"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </Preview>
      )}

      {/* Indicador de audio */}
      {isAudio && value && (
        <AudioIndicator $playing={isPlaying}>
          {isPlaying ? '>> Reproduciendo...' : `>> ${value.split('/').pop()}`}
        </AudioIndicator>
      )}

      {showGallery && (
        <GalleryOverlay onClick={() => setShowGallery(false)}>
          <GalleryModal onClick={(e) => e.stopPropagation()}>
            <GalleryHeader>
              <GalleryTitle>Galeria de assets</GalleryTitle>
              <CloseBtn onClick={() => setShowGallery(false)}>x</CloseBtn>
            </GalleryHeader>
            <GalleryGrid>
              {assets.length === 0 && <EmptyText>No hay assets. Sube archivos primero.</EmptyText>}
              {assets.map((a) => {
                const filename = a.key.split('/').pop() || '';
                const isAudioItem = isAudioAsset(filename);
                return (
                  <GalleryItem
                    key={a.key}
                    onClick={() => {
                      onChange(`asset:${a.key}`);
                      setShowGallery(false);
                    }}
                  >
                    {isAudioItem ? (
                      <AudioThumb>&#9835;</AudioThumb>
                    ) : (
                      <GalleryThumb src={a.url} alt={a.key} />
                    )}
                    <GalleryName>{filename}</GalleryName>
                  </GalleryItem>
                );
              })}
            </GalleryGrid>
          </GalleryModal>
        </GalleryOverlay>
      )}
    </Wrapper>
  );
};

export default AssetPicker;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const Row = styled.div`
  display: flex;
  gap: 4px;
`;

const Input = styled.input`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;
  &:focus { border-color: ${(p) => p.theme.terminal.accent}; }
`;

const UploadBtn = styled.button`
  background: none;
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.success};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  &:hover { border-color: ${(p) => p.theme.terminal.success}; }
`;

const GalleryBtn = styled.button`
  background: none;
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.accent};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  &:hover { border-color: ${(p) => p.theme.terminal.accent}; }
`;

const Preview = styled.div`
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 2px;
  overflow: hidden;
  max-height: 80px;
`;

const PreviewImg = styled.img`
  width: 100%;
  height: 80px;
  object-fit: cover;
`;

const GalleryOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const GalleryModal = styled.div`
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.accent};
  border-radius: 4px;
  width: 400px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
`;

const GalleryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
`;

const GalleryTitle = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
`;

const GalleryItem = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  &:hover { opacity: 0.8; }
`;

const GalleryThumb = styled.img`
  width: 100%;
  height: 60px;
  object-fit: cover;
  border-radius: 2px;
  border: 1px solid ${(p) => p.theme.terminal.border};
`;

const GalleryName = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.accentDim};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AudioBtn = styled.button<{ $playing: boolean }>`
  background: none;
  border: 1px solid ${(p) => p.$playing ? p.theme.terminal.warning : p.theme.terminal.border};
  color: ${(p) => p.$playing ? p.theme.terminal.warning : p.theme.terminal.accent};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 2px;
  min-width: 24px;
  &:hover { border-color: ${(p) => p.theme.terminal.warning}; }
`;

const AudioIndicator = styled.div<{ $playing: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.$playing ? p.theme.terminal.warning : p.theme.terminal.accentDim};
  padding: 2px 4px;
  opacity: 0.8;
`;

const AudioThumb = styled.div`
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 2px;
  font-size: 24px;
  color: ${(p) => p.theme.terminal.accent};
  background: ${(p) => p.theme.terminal.dialogBackground};
`;

const EmptyText = styled.div`
  grid-column: 1 / -1;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-align: center;
  padding: 20px;
`;
