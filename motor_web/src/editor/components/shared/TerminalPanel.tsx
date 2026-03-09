// editor/components/shared/TerminalPanel.tsx
// Contenedor con estilo terminal (borde, fondo, título)

import React from 'react';
import styled from 'styled-components';

interface TerminalPanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ title, children, className, actions }) => {
  return (
    <PanelContainer className={className}>
      {title && (
        <PanelHeader>
          <PanelTitle>{title}</PanelTitle>
          {actions && <PanelActions>{actions}</PanelActions>}
        </PanelHeader>
      )}
      <PanelContent>{children}</PanelContent>
    </PanelContainer>
  );
};

export default TerminalPanel;

const PanelContainer = styled.div`
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 4px;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
`;

const PanelTitle = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const PanelActions = styled.div`
  display: flex;
  gap: 4px;
`;

const PanelContent = styled.div`
  padding: 8px 10px;
`;
