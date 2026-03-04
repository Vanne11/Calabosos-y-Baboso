// components/layout/SpeedControl.tsx
// Control de velocidad y volumen

import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';

const Container = styled.div`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: #1e1e2f;
  border: 1px solid #444;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  z-index: 999;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  color: white;
`;

const Select = styled.select`
  margin-left: 0.5rem;
  background: #2a2a3d;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.2rem 0.4rem;
  font-family: inherit;
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: 1.5rem;
`;

const Slider = styled.input`
  width: 100px;
  margin: 0 0.5rem;
  appearance: none;
  height: 4px;
  background: #444;
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #bd93f9;
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #bd93f9;
    border-radius: 50%;
    cursor: pointer;
  }
`;

const SpeedControl: React.FC = () => {
  const speed = useAppStore((s) => s.speed);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const volume = useAppStore((s) => s.volume);
  const setVolume = useAppStore((s) => s.setVolume);

  return (
    <Container>
      Velocidad:
      <Select
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
      >
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={2}>2x</option>
        <option value={3}>3x</option>
      </Select>
      <VolumeContainer>
        <label htmlFor="volume">Volumen:</label>
        <Slider
          type="range"
          id="volume"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
        <span>{volume}%</span>
      </VolumeContainer>
    </Container>
  );
};

export default SpeedControl;
