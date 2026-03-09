// components/ui/HoverPreview.tsx
// Imagen con preview flotante al hacer hover (usa portal para escapar overflow:hidden)

import React, { useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

const Thumbnail = styled.img<{ $size: number }>`
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
`;

const FloatingPreview = styled.img<{ $x: number; $y: number }>`
  position: fixed;
  left: ${(p) => p.$x}px;
  top: ${(p) => p.$y}px;
  width: 180px;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid ${(p) => p.theme.accent};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
  z-index: 9999;
  pointer-events: none;
  transition: opacity 0.15s ease;
`;

interface HoverPreviewProps {
  src: string;
  alt: string;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}

const HoverPreview: React.FC<HoverPreviewProps> = ({ src, alt, size, className, style }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const thumbRef = useRef<HTMLImageElement>(null);

  const PREVIEW_SIZE = 180;
  const GAP = 8;

  const handleEnter = useCallback(() => {
    if (!thumbRef.current) return;
    const rect = thumbRef.current.getBoundingClientRect();

    // Position preview centered above the thumbnail
    let x = rect.left + rect.width / 2 - PREVIEW_SIZE / 2;
    let y = rect.top - PREVIEW_SIZE - GAP;

    // Clamp to viewport
    if (x < GAP) x = GAP;
    if (x + PREVIEW_SIZE > window.innerWidth - GAP) x = window.innerWidth - PREVIEW_SIZE - GAP;
    if (y < GAP) {
      // Show below instead
      y = rect.bottom + GAP;
    }
    if (y + PREVIEW_SIZE > window.innerHeight - GAP) {
      y = window.innerHeight - PREVIEW_SIZE - GAP;
    }

    setPos({ x, y });
    setShow(true);
  }, []);

  const handleLeave = useCallback(() => setShow(false), []);

  return (
    <>
      <Thumbnail
        ref={thumbRef}
        src={src}
        alt={alt}
        $size={size}
        className={className}
        style={style}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      />
      {show &&
        ReactDOM.createPortal(
          <FloatingPreview src={src} alt={alt} $x={pos.x} $y={pos.y} />,
          document.body
        )}
    </>
  );
};

export default HoverPreview;
