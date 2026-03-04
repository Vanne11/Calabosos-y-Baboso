// components/terminal/TerminalEntry.tsx
// Renderiza una entrada individual del historial

import React from 'react';
import styled, { useTheme } from 'styled-components';
import RichText from './RichText';
import type { TerminalEntry as TEntry } from '../../types/terminal';
import type { AppTheme } from '../../types/theme';

const EntryLine = styled.div<{ $color?: string }>`
  margin-bottom: 2px;
  color: ${(props) => props.$color || props.theme.terminal.text};
  word-wrap: break-word;
  white-space: pre-wrap;
`;

const CommandLine = styled(EntryLine)`
  color: ${(props) => props.theme.terminal.command};
  &::before {
    content: '> ';
    color: ${(props) => props.theme.terminal.prompt};
  }
`;

const DialogHeader = styled(EntryLine)`
  color: ${(props) => props.theme.terminal.character};
  font-weight: bold;
  border-left: 3px solid ${(props) => props.theme.terminal.characterBorder};
  padding-left: 8px;
  margin-top: 8px;
`;

const DialogLine = styled(EntryLine)`
  color: ${(props) => props.theme.terminal.dialog};
  padding-left: 12px;
`;

const OptionLine = styled(EntryLine)`
  color: ${(props) => props.theme.terminal.option};
  font-style: italic;
`;

interface TerminalEntryProps {
  entry: TEntry;
}

const TerminalEntryComponent: React.FC<TerminalEntryProps> = ({ entry }) => {
  const theme = useTheme() as AppTheme;

  switch (entry.type) {
    case 'command':
      return (
        <CommandLine>
          <RichText text={entry.content} />
        </CommandLine>
      );

    case 'dialogHeader':
      return (
        <DialogHeader>
          <RichText text={entry.content} />
        </DialogHeader>
      );

    case 'dialog':
      return (
        <DialogLine>
          <RichText text={entry.content} />
        </DialogLine>
      );

    case 'option':
      return (
        <OptionLine>
          <RichText text={entry.content} />
        </OptionLine>
      );

    case 'error':
      return (
        <EntryLine $color={theme.terminal.error}>
          <RichText text={entry.content} />
        </EntryLine>
      );

    case 'success':
      return (
        <EntryLine $color={theme.terminal.success}>
          <RichText text={entry.content} />
        </EntryLine>
      );

    case 'warning':
      return (
        <EntryLine $color={theme.terminal.warning}>
          <RichText text={entry.content} />
        </EntryLine>
      );

    case 'info':
      return (
        <EntryLine $color={theme.terminal.info}>
          <RichText text={entry.content} />
        </EntryLine>
      );

    default:
      return (
        <EntryLine>
          <RichText text={entry.content} />
        </EntryLine>
      );
  }
};

export default TerminalEntryComponent;
