// editor/components/shared/ConfirmDialog.tsx

import React from 'react';
import styled from 'styled-components';
import TerminalButton from './TerminalButton';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <Overlay onClick={onCancel}>
      <DialogBox onClick={(e) => e.stopPropagation()}>
        <Message>{message}</Message>
        <ButtonRow>
          <TerminalButton variant="danger" onClick={onConfirm}>
            Confirmar
          </TerminalButton>
          <TerminalButton variant="ghost" onClick={onCancel}>
            Cancelar
          </TerminalButton>
        </ButtonRow>
      </DialogBox>
    </Overlay>
  );
};

export default ConfirmDialog;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogBox = styled.div`
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.accent};
  border-radius: 4px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
`;

const Message = styled.p`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: ${(p) => p.theme.terminal.text};
  margin: 0 0 16px 0;
  line-height: 1.4;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;
