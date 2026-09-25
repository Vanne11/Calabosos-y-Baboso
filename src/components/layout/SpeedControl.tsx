// components/layout/SpeedControl.tsx
// Botón de configuración (engranaje) que abre un modal con velocidad, volúmenes y efectos de pantalla

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAppStore } from '../../store/useAppStore';
import { sfx } from '../../audio/SfxPlayer';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(90deg); }
`;

const GearButton = styled.button<{ $open?: boolean }>`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid ${(props) => props.theme.terminal.border || '#444'};
  background: ${(props) => props.theme.terminal.background || '#1e1e2f'};
  color: ${(props) => props.$open ? (props.theme.accent || '#bd93f9') : (props.theme.textSecondary || '#aaa')};
  font-size: 1.3rem;
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: ${(props) => props.theme.accent || '#bd93f9'};
    border-color: ${(props) => props.theme.accent || '#bd93f9'};
    animation: ${spin} 0.3s ease-out;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 998;
`;

const Modal = styled.div`
  position: fixed;
  bottom: 4rem;
  right: 1rem;
  background: ${(props) => props.theme.terminal.background || '#1e1e2f'};
  border: 1px solid ${(props) => props.theme.accent || '#bd93f9'};
  border-radius: 10px;
  padding: 1rem 1.2rem;
  z-index: 999;
  min-width: 220px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  font-family: 'Courier New', monospace;
`;

const ModalTitle = styled.div`
  color: ${(props) => props.theme.accent || '#bd93f9'};
  font-weight: bold;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const Label = styled.span`
  color: ${(props) => props.theme.textSecondary || '#aaa'};
  font-size: 0.8rem;
  flex-shrink: 0;
`;

const Select = styled.select`
  background: ${(props) => props.theme.widgets.background || '#2a2a3d'};
  color: ${(props) => props.theme.text || 'white'};
  border: 1px solid ${(props) => props.theme.terminal.border || '#444'};
  border-radius: 5px;
  padding: 0.25rem 0.4rem;
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
`;

const Slider = styled.input`
  flex: 1;
  appearance: none;
  height: 4px;
  background: ${(props) => props.theme.terminal.border || '#444'};
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    background: ${(props) => props.theme.accent || '#bd93f9'};
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: ${(props) => props.theme.accent || '#bd93f9'};
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

const Value = styled.span`
  color: ${(props) => props.theme.text || 'white'};
  font-size: 0.75rem;
  min-width: 32px;
  text-align: right;
`;

const Toggle = styled.input`
  accent-color: ${(props) => props.theme.accent || '#bd93f9'};
  cursor: pointer;
`;

const VolumeRow: React.FC<{ label: string; value: number; onChange: (v: number) => void; onRelease?: () => void }> = ({
  label, value, onChange, onRelease,
}) => (
  <ControlRow>
    <Label>{label}</Label>
    <SliderRow>
      <Slider
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onRelease}
        onKeyUp={onRelease}
      />
      <Value>{value}%</Value>
    </SliderRow>
  </ControlRow>
);

const SpeedControl: React.FC = () => {
  const [open, setOpen] = useState(false);
  const speed = useAppStore((s) => s.speed);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const volume = useAppStore((s) => s.volume);
  const setVolume = useAppStore((s) => s.setVolume);
  const sfxVolume = useAppStore((s) => s.sfxVolume);
  const setSfxVolume = useAppStore((s) => s.setSfxVolume);
  const voices = useAppStore((s) => s.voices);
  const setVoices = useAppStore((s) => s.setVoices);
  const screenFx = useAppStore((s) => s.screenFx);
  const setScreenFx = useAppStore((s) => s.setScreenFx);

  return (
    <>
      {open && <Overlay onClick={() => setOpen(false)} />}
      {open && (
        <Modal>
          <ModalTitle>Configuración</ModalTitle>
          <ControlRow>
            <Label>Velocidad</Label>
            <Select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={3}>3x</option>
            </Select>
          </ControlRow>
          <VolumeRow label="Música" value={volume} onChange={setVolume} />
          <VolumeRow label="Efectos" value={sfxVolume} onChange={setSfxVolume} onRelease={() => sfx.play('moneda')} />
          <ControlRow>
            <Label>Voces en diálogos</Label>
            <Toggle type="checkbox" checked={voices} onChange={(e) => setVoices(e.target.checked)} />
          </ControlRow>
          <ControlRow>
            <Label>Temblor y destellos</Label>
            <Toggle type="checkbox" checked={screenFx} onChange={(e) => setScreenFx(e.target.checked)} />
          </ControlRow>
        </Modal>
      )}
      <GearButton $open={open} onClick={() => setOpen(!open)}>
        &#9881;
      </GearButton>
    </>
  );
};

export default SpeedControl;
