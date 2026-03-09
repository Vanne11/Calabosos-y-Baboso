// editor/components/shared/TerminalButton.tsx

import React from 'react';
import styled, { css } from 'styled-components';

interface TerminalButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  title?: string;
}

const TerminalButton: React.FC<TerminalButtonProps> = ({
  onClick,
  children,
  variant = 'default',
  size = 'md',
  disabled,
  className,
  title,
}) => {
  return (
    <StyledButton
      onClick={onClick}
      $variant={variant}
      $size={size}
      disabled={disabled}
      className={className}
      title={title}
    >
      {children}
    </StyledButton>
  );
};

export default TerminalButton;

const StyledButton = styled.button<{ $variant: string; $size: string }>`
  font-family: 'Courier New', monospace;
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  ${(p) =>
    p.$size === 'sm'
      ? css`
          font-size: 11px;
          padding: 3px 8px;
        `
      : css`
          font-size: 13px;
          padding: 6px 12px;
        `}

  ${(p) => {
    switch (p.$variant) {
      case 'primary':
        return css`
          background: ${p.theme.terminal.accent};
          color: ${p.theme.terminal.background};
          border-color: ${p.theme.terminal.accent};
          &:hover:not(:disabled) {
            opacity: 0.85;
          }
        `;
      case 'danger':
        return css`
          background: transparent;
          color: ${p.theme.terminal.error};
          border-color: ${p.theme.terminal.error};
          &:hover:not(:disabled) {
            background: ${p.theme.terminal.error};
            color: ${p.theme.terminal.background};
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${p.theme.terminal.accentDim};
          border-color: transparent;
          &:hover:not(:disabled) {
            color: ${p.theme.terminal.accent};
            border-color: ${p.theme.terminal.border};
          }
        `;
      default:
        return css`
          background: ${p.theme.button.background};
          color: ${p.theme.button.text};
          &:hover:not(:disabled) {
            background: ${p.theme.button.hoverBackground};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
