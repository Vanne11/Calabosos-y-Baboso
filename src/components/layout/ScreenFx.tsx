// components/layout/ScreenFx.tsx
// Destellos de pantalla (daño, curación, oro, nivel, muerte) y sacudida del contenedor.

import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useFxStore, type FlashKind } from '../../store/useFxStore';

const FLASH: Record<FlashKind, { color: string; ms: number; peak: number }> = {
  damage: { color: '255, 40, 40', ms: 450, peak: 0.35 },
  heal: { color: '60, 255, 120', ms: 600, peak: 0.18 },
  gold: { color: '255, 210, 60', ms: 700, peak: 0.22 },
  level: { color: '140, 200, 255', ms: 900, peak: 0.25 },
  death: { color: '140, 0, 0', ms: 2500, peak: 0.55 },
};

const fade = keyframes`
  from { opacity: var(--peak); }
  to { opacity: 0; }
`;

const Flash = styled.div<{ $rgb: string; $ms: number; $peak: number }>`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2000;
  --peak: ${(p) => p.$peak};
  background: radial-gradient(ellipse at center, rgba(${(p) => p.$rgb}, 0.15) 0%, rgba(${(p) => p.$rgb}, 1) 100%);
  opacity: 0;
  animation: ${fade} ${(p) => p.$ms}ms ease-out forwards;
`;

/** Overlay de destellos. `shakeTarget` es el elemento que tiembla. */
const ScreenFx: React.FC<{ shakeTarget: React.RefObject<HTMLElement | null> }> = ({ shakeTarget }) => {
  const flashKey = useFxStore((s) => s.flashKey);
  const flashKind = useFxStore((s) => s.flashKind);
  const shakeKey = useFxStore((s) => s.shakeKey);
  const strength = useFxStore((s) => s.shakeStrength);

  useEffect(() => {
    const el = shakeTarget.current;
    if (!shakeKey || !el?.animate) return;
    const px = 3 + strength * 3;
    const frames: Keyframe[] = [];
    for (let i = 0; i < 8; i++) {
      const decay = 1 - i / 8;
      frames.push({ transform: `translate(${(Math.random() * 2 - 1) * px * decay}px, ${(Math.random() * 2 - 1) * px * decay}px)` });
    }
    frames.push({ transform: 'translate(0, 0)' });
    el.animate(frames, { duration: 300 + strength * 80, easing: 'linear' });
  }, [shakeKey, strength, shakeTarget]);

  if (!flashKind) return null;
  const f = FLASH[flashKind];
  return <Flash key={flashKey} $rgb={f.color} $ms={f.ms} $peak={f.peak} />;
};

export default ScreenFx;
