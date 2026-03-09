// editor/components/shared/TerminalSelect.tsx

import React from 'react';
import styled from 'styled-components';

interface TerminalSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}

const TerminalSelect: React.FC<TerminalSelectProps> = ({
  value,
  onChange,
  options,
  label,
  className,
}) => {
  return (
    <SelectWrapper className={className}>
      {label && <SelectLabel>{label}</SelectLabel>}
      <StyledSelect value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </StyledSelect>
    </SelectWrapper>
  );
};

export default TerminalSelect;

const SelectWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SelectLabel = styled.label`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const StyledSelect = styled.select`
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  width: 100%;

  &:focus {
    border-color: ${(p) => p.theme.terminal.accent};
  }

  option {
    background: ${(p) => p.theme.terminal.background};
    color: ${(p) => p.theme.terminal.text};
  }
`;
