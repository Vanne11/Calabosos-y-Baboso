// components/layout/MobileWarning.tsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Warning = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: ${(props) => props.theme.terminal.dialogBackground};
  color: ${(props) => props.theme.terminal.text};
  padding: 1rem;
  z-index: 999;
  border-bottom: 2px solid ${(props) => props.theme.terminal.accent};
  font-size: 0.9rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  animation: slideDown 0.5s ease;

  @keyframes slideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: ${(props) => props.theme.terminal.accent};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;

  &:hover {
    color: ${(props) => props.theme.terminal.error};
  }
`;

const MobileWarning: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768;

    if (isMobile) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <Warning>
      <div>
        Este sitio está diseñado para PC. En dispositivos móviles puede
        comportarse de forma extraña, como una babosa en una pista de baile.
      </div>
      <CloseBtn onClick={() => setShow(false)}>✕</CloseBtn>
    </Warning>
  );
};

export default MobileWarning;
