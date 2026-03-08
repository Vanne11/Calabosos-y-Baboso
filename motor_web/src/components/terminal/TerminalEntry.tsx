// components/terminal/TerminalEntry.tsx
// Renderiza una entrada individual del historial

import React from 'react';
import styled, { useTheme } from 'styled-components';
import RichText from './RichText';
import HoverPreview from '../ui/HoverPreview';
import type { TerminalEntry as TEntry } from '../../types/terminal';
import type { AppTheme } from '../../types/theme';

const EntryLine = styled.div<{ $color?: string; $faded?: boolean }>`
  margin-bottom: 2px;
  color: ${(props) => props.$color || props.theme.terminal.text};
  word-wrap: break-word;
  white-space: pre-wrap;
  ${(props) => props.$faded && `opacity: 0.35;`}
  transition: opacity 0.4s ease;
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
  display: flex;
  align-items: center;
  gap: 8px;
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
  faded?: boolean;
}

const TerminalEntryComponent: React.FC<TerminalEntryProps> = ({ entry, faded }) => {
  const theme = useTheme() as AppTheme;
  const f = faded || false;

  switch (entry.type) {
    case 'command':
      return (
        <CommandLine $faded={f}>
          <RichText text={entry.content} />
        </CommandLine>
      );

    case 'dialogHeader':
      return (
        <DialogHeader $faded={f}>
          {entry.image && (
            <HoverPreview
              src={entry.image}
              alt={entry.content}
              size={entry.firstAppearance ? 80 : 36}
            />
          )}
          <RichText text={entry.content} />
        </DialogHeader>
      );

    case 'dialog':
      return (
        <DialogLine $faded={f}>
          <RichText text={entry.content} />
        </DialogLine>
      );

    case 'option':
      return (
        <OptionLine $faded={f}>
          <RichText text={entry.content} />
        </OptionLine>
      );

    case 'error':
      return (
        <EntryLine $color={theme.terminal.error} $faded={f}>
          <RichText text={entry.content} />
        </EntryLine>
      );

    case 'success':
      return (
        <EntryLine $color={theme.terminal.success} $faded={f}>
          <RichText text={entry.content} />
        </EntryLine>
      );

    case 'warning':
      return (
        <EntryLine $color={theme.terminal.warning} $faded={f}>
          <RichText text={entry.content} />
        </EntryLine>
      );

    case 'info':
      return (
        <EntryLine $color={theme.terminal.info} $faded={f}>
          <RichText text={entry.content} />
        </EntryLine>
      );

    default:
      return (
        <EntryLine $faded={f}>
          <RichText text={entry.content} />
        </EntryLine>
      );
  }
};

export default TerminalEntryComponent;
