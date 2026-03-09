// components/layout/AppShell.tsx
// Layout principal: desktop side-by-side, mobile stacked

import React from 'react';
import styled from 'styled-components';
import StatusBar from './StatusBar';
import ImagePanel from './ImagePanel';
import SpeedControl from './SpeedControl';
import MobileWarning from './MobileWarning';
import InventoryPanel from './InventoryPanel';
import InventoryExpanded from './InventoryExpanded';
import { useAppStore } from '../../store/useAppStore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background-color: ${(props) => props.theme.background};
  color: ${(props) => props.theme.text};
  font-family: 'Courier New', monospace;
  padding: 1rem;
  overflow: hidden;
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  gap: 1rem;
  overflow: hidden;
  min-height: 0;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ImageSide = styled.div`
  flex: 0 0 40%;
  max-width: 40%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    flex: 0 0 auto;
    max-width: 100%;
    max-height: 30vh;
    max-height: 30dvh;
  }
`;

const TerminalSide = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
`;

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const phase = useAppStore((s) => s.phase);
  const showImage = phase === 'game';

  return (
    <Container>
      <MobileWarning />
      <StatusBar />
      <MainArea>
        {showImage && (
          <ImageSide>
            <ImagePanel />
          </ImageSide>
        )}
        <TerminalSide>
          {children}
          <InventoryPanel />
        </TerminalSide>
      </MainArea>
      <SpeedControl />
      <InventoryExpanded />
    </Container>
  );
};

export default AppShell;
