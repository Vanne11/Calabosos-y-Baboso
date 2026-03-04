// components/layout/AppShell.tsx
// Layout principal: StatusBar + ImagePanel + Terminal + SpeedControl

import React from 'react';
import styled from 'styled-components';
import StatusBar from './StatusBar';
import ImagePanel from './ImagePanel';
import SpeedControl from './SpeedControl';
import MobileWarning from './MobileWarning';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${(props) => props.theme.background};
  color: ${(props) => props.theme.text};
  font-family: 'Courier New', monospace;
  padding: 1rem;
  overflow: hidden;
`;

const TerminalWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <Container>
      <MobileWarning />
      <StatusBar />
      <ImagePanel />
      <TerminalWrapper>{children}</TerminalWrapper>
      <SpeedControl />
    </Container>
  );
};

export default AppShell;
