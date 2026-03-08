// editor/components/toolbar/ShortcutsModal.tsx
// Modal de referencia de atajos de teclado

import React from 'react';
import styled from 'styled-components';

interface ShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: 'Ctrl+Z', action: 'Deshacer' },
  { keys: 'Ctrl+Shift+Z', action: 'Rehacer' },
  { keys: 'Ctrl+S', action: 'Guardar' },
  { keys: 'Ctrl+E', action: 'Exportar ZIP' },
  { keys: 'Ctrl+F', action: 'Buscar escena' },
  { keys: 'Ctrl+N', action: 'Nueva escena' },
  { keys: 'Ctrl+D', action: 'Duplicar escena' },
  { keys: 'Delete', action: 'Eliminar escena' },
  { keys: 'Escape', action: 'Deseleccionar' },
  { keys: '?', action: 'Mostrar atajos' },
];

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>Atajos de teclado</Title>
          <CloseBtn onClick={onClose}>x</CloseBtn>
        </ModalHeader>
        <ModalBody>
          {SHORTCUTS.map((s) => (
            <ShortcutRow key={s.keys}>
              <Keys>{s.keys}</Keys>
              <Action>{s.action}</Action>
            </ShortcutRow>
          ))}
        </ModalBody>
      </Modal>
    </Overlay>
  );
};

export default ShortcutsModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.accent};
  border-radius: 4px;
  width: 340px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
`;

const Title = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 14px;
`;

const ModalBody = styled.div`
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ShortcutRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Keys = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.warning};
  background: ${(p) => p.theme.terminal.dialogBackground};
  padding: 2px 6px;
  border-radius: 2px;
  border: 1px solid ${(p) => p.theme.terminal.border};
`;

const Action = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.text};
`;
