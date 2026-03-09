// editor/components/toolbar/ValidationPanel.tsx
// Panel que muestra errores y warnings de validación

import React from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import type { ValidationIssue } from '../../types/editor';

interface ValidationPanelProps {
  onClose: () => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ onClose }) => {
  const issues = useEditorStore((s) => s.issues);

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Validación</Title>
          <CloseBtn onClick={onClose}>x</CloseBtn>
        </Header>
        <Body>
          {issues.length === 0 ? (
            <NoIssues>Sin problemas detectados. Buen trabajo (por una vez).</NoIssues>
          ) : (
            <>
              <Summary>
                {errors.length > 0 && <ErrorCount>{errors.length} errores</ErrorCount>}
                {warnings.length > 0 && <WarningCount>{warnings.length} warnings</WarningCount>}
              </Summary>
              <IssueList>
                {issues.map((issue, i) => (
                  <IssueItem key={i} $severity={issue.severity}>
                    <IssueIcon>{issue.severity === 'error' ? '!' : '?'}</IssueIcon>
                    <IssueText>
                      {issue.message}
                      {issue.sceneId && (
                        <IssueScene> [{issue.sceneId}]</IssueScene>
                      )}
                    </IssueText>
                  </IssueItem>
                ))}
              </IssueList>
            </>
          )}
        </Body>
      </Panel>
    </Overlay>
  );
};

export default ValidationPanel;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Panel = styled.div`
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.accent};
  border-radius: 4px;
  width: 90%;
  max-width: 500px;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
`;

const Title = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-size: 16px;
  font-family: 'Courier New', monospace;
`;

const Body = styled.div`
  padding: 14px;
  overflow-y: auto;
`;

const NoIssues = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: ${(p) => p.theme.terminal.success};
  text-align: center;
  padding: 20px;
`;

const Summary = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

const ErrorCount = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.error};
  font-weight: bold;
`;

const WarningCount = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.warning};
  font-weight: bold;
`;

const IssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const IssueItem = styled.div<{ $severity: string }>`
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  background: ${(p) =>
    p.$severity === 'error' ? 'rgba(255,85,85,0.08)' : 'rgba(255,184,108,0.08)'};
  border-left: 3px solid ${(p) =>
    p.$severity === 'error' ? p.theme.terminal.error : p.theme.terminal.warning};
  border-radius: 2px;
`;

const IssueIcon = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
`;

const IssueText = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.text};
  line-height: 1.4;
`;

const IssueScene = styled.span`
  color: ${(p) => p.theme.terminal.accentDim};
`;
