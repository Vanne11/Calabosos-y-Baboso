// editor/components/shared/GotoSelect.tsx
// Input con dropdown filtrable de escenas existentes + warning si goto no existe

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import { SPECIAL_DESTINATIONS } from '../canvas/SpecialNode';

interface GotoSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const GotoSelect: React.FC<GotoSelectProps> = ({ label, value, onChange, placeholder = 'scene_id' }) => {
  const nodes = useEditorStore((s) => s.nodes);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const sceneIds = nodes.map((n) => n.data.sceneId);
  const specialIds = Object.keys(SPECIAL_DESTINATIONS);
  const allIds = [...sceneIds, ...specialIds.filter((id) => !sceneIds.includes(id))];
  const exists = !value || allIds.includes(value);

  const filtered = allIds.filter((id) =>
    id.toLowerCase().includes((filter || value).toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFilter('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <Wrapper ref={wrapperRef}>
      {label && <Label>{label}</Label>}
      <InputRow>
        <Input
          value={open ? filter : value}
          onChange={(e) => {
            if (open) {
              setFilter(e.target.value);
            } else {
              onChange(e.target.value);
            }
          }}
          onFocus={() => {
            setOpen(true);
            setFilter(value);
          }}
          placeholder={placeholder}
          $warning={!exists}
        />
        {!exists && value && <WarningIcon title="Esta escena no existe">!</WarningIcon>}
      </InputRow>
      {open && filtered.length > 0 && (
        <Dropdown>
          {filtered.map((id) => {
            const special = SPECIAL_DESTINATIONS[id];
            return (
              <DropdownItem
                key={id}
                $active={id === value}
                $special={!!special}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(id);
                  setOpen(false);
                  setFilter('');
                }}
              >
                {special ? `${special.icon} ${special.label} (${id})` : id}
              </DropdownItem>
            );
          })}
        </Dropdown>
      )}
    </Wrapper>
  );
};

export default GotoSelect;

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Label = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Input = styled.input<{ $warning?: boolean }>`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => (p.$warning ? p.theme.terminal.warning : p.theme.terminal.border)};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;

  &:focus {
    border-color: ${(p) => (p.$warning ? p.theme.terminal.warning : p.theme.terminal.accent)};
  }
`;

const WarningIcon = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  color: ${(p) => p.theme.terminal.warning};
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 150px;
  overflow-y: auto;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.accent};
  border-radius: 2px;
  margin-top: 2px;
`;

const DropdownItem = styled.div<{ $active?: boolean; $special?: boolean }>`
  padding: 4px 8px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => (p.$special ? p.theme.terminal.error : p.$active ? p.theme.terminal.accent : p.theme.terminal.text)};
  background: ${(p) => (p.$active ? p.theme.terminal.dialogBackground : 'transparent')};
  cursor: pointer;
  ${(p) => p.$special && 'border-top: 1px solid ' + p.theme.terminal.border + ';'}

  &:hover {
    background: ${(p) => p.theme.terminal.dialogBackground};
    color: ${(p) => (p.$special ? p.theme.terminal.error : p.theme.terminal.accent)};
  }
`;
