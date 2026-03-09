// components/terminal/TerminalHistory.tsx
// Renderiza el historial de la terminal

import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import TerminalEntryComponent from './TerminalEntry';
import { useAppStore } from '../../store/useAppStore';

const OutputWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: ${(props) => props.theme.scrollbar.thumb} ${(props) => props.theme.scrollbar.track};
  padding-bottom: 40px;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: ${(props) => props.theme.scrollbar.track};
  }
  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.scrollbar.thumb};
    border-radius: 4px;
  }
`;

const WidgetWrapper = styled.div<{ $dimmed: boolean }>`
  opacity: ${(p) => (p.$dimmed ? 0.3 : 1)};
  transition: opacity 0.4s ease;
  pointer-events: ${(p) => (p.$dimmed ? 'none' : 'auto')};
`;

interface TerminalHistoryProps {
  children?: React.ReactNode;
}

const TerminalHistory: React.FC<TerminalHistoryProps> = ({ children }) => {
  const history = useAppStore((s) => s.history);
  const fadeBeforeIndex = useAppStore((s) => s.fadeBeforeIndex);
  const widgetDimmed = useAppStore((s) => s.widgetDimmed);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
      setTimeout(() => {
        if (ref.current) ref.current.scrollTop = ref.current.scrollHeight + 1000;
      }, 50);
    }
  }, [history, children]);

  return (
    <OutputWrapper ref={ref}>
      {history.map((entry, i) => (
        <TerminalEntryComponent key={i} entry={entry} faded={i < fadeBeforeIndex} />
      ))}
      {children && (
        <WidgetWrapper $dimmed={widgetDimmed}>
          {children}
        </WidgetWrapper>
      )}
    </OutputWrapper>
  );
};

export default TerminalHistory;
