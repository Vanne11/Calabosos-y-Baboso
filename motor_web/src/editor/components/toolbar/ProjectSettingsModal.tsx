// editor/components/toolbar/ProjectSettingsModal.tsx
// Modal de configuración del proyecto: nombre, personajes, stats

import React, { useState } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import TerminalInput from '../shared/TerminalInput';
import TerminalButton from '../shared/TerminalButton';
import TagInput from '../shared/TagInput';
import type { CharacterDef } from '../../../types/game';

interface ProjectSettingsModalProps {
  onClose: () => void;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ onClose }) => {
  const project = useEditorStore((s) => s.project);
  const updateProject = useEditorStore((s) => s.updateProject);
  const [tab, setTab] = useState<'general' | 'characters' | 'stats'>('general');

  if (!project) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Configuración del Proyecto</ModalTitle>
          <CloseBtn onClick={onClose}>x</CloseBtn>
        </ModalHeader>

        <TabBar>
          <Tab $active={tab === 'general'} onClick={() => setTab('general')}>General</Tab>
          <Tab $active={tab === 'characters'} onClick={() => setTab('characters')}>Personajes</Tab>
          <Tab $active={tab === 'stats'} onClick={() => setTab('stats')}>Stats</Tab>
        </TabBar>

        <ModalBody>
          {tab === 'general' && (
            <Section>
              <TerminalInput
                label="Nombre"
                value={project.name}
                onChange={(name) => updateProject({ name })}
              />
              <TerminalInput
                label="Descripción"
                value={project.description}
                onChange={(description) => updateProject({ description })}
                multiline
                rows={2}
              />
              <TerminalInput
                label="Autor"
                value={project.author}
                onChange={(author) => updateProject({ author })}
              />
              <TerminalInput
                label="Versión"
                value={project.version}
                onChange={(version) => updateProject({ version })}
              />
            </Section>
          )}

          {tab === 'characters' && (
            <Section>
              {Object.entries(project.characters).map(([id, char]) => (
                <CharBlock key={id}>
                  <CharHeader>
                    <CharId>{id}</CharId>
                    <DelBtn onClick={() => {
                      const { [id]: _, ...rest } = project.characters;
                      updateProject({ characters: rest });
                    }}>x</DelBtn>
                  </CharHeader>
                  <TerminalInput
                    label="Nombre"
                    value={char.name}
                    onChange={(name) => {
                      updateProject({
                        characters: { ...project.characters, [id]: { ...char, name } },
                      });
                    }}
                  />
                  <TerminalInput
                    label="Descripción"
                    value={char.description}
                    onChange={(description) => {
                      updateProject({
                        characters: { ...project.characters, [id]: { ...char, description } },
                      });
                    }}
                  />
                  <TerminalInput
                    label="Imagen"
                    value={char.image || ''}
                    onChange={(image) => {
                      updateProject({
                        characters: {
                          ...project.characters,
                          [id]: { ...char, image: image || undefined },
                        },
                      });
                    }}
                    placeholder="/images/personaje.png"
                  />
                </CharBlock>
              ))}
              <TerminalButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newId = `personaje_${Object.keys(project.characters).length + 1}`;
                  const newChar: CharacterDef = { name: 'Nuevo Personaje', description: '' };
                  updateProject({
                    characters: { ...project.characters, [newId]: newChar },
                  });
                }}
              >
                + Agregar personaje
              </TerminalButton>
            </Section>
          )}

          {tab === 'stats' && (
            <Section>
              <SubTitle>Stats iniciales</SubTitle>
              {Object.entries(project.initialStats).map(([key, val]) => (
                <StatRow key={key}>
                  <StatInput
                    value={key}
                    onChange={(e) => {
                      const { [key]: oldVal, ...rest } = project.initialStats;
                      updateProject({ initialStats: { ...rest, [e.target.value]: oldVal } });
                    }}
                    placeholder="stat"
                  />
                  <StatInput
                    value={String(val)}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      updateProject({
                        initialStats: {
                          ...project.initialStats,
                          [key]: isNaN(num) ? e.target.value : num,
                        },
                      });
                    }}
                    placeholder="valor"
                    style={{ width: 80 }}
                  />
                  <DelBtn onClick={() => {
                    const { [key]: _, ...rest } = project.initialStats;
                    updateProject({ initialStats: rest });
                  }}>x</DelBtn>
                </StatRow>
              ))}
              <TerminalButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateProject({
                    initialStats: { ...project.initialStats, nueva_stat: 0 },
                  });
                }}
              >
                + Agregar stat
              </TerminalButton>

              <SubTitle>Flags iniciales</SubTitle>
              {Object.entries(project.initialFlags).map(([key, val]) => (
                <StatRow key={key}>
                  <StatInput
                    value={key}
                    onChange={(e) => {
                      const { [key]: oldVal, ...rest } = project.initialFlags;
                      updateProject({ initialFlags: { ...rest, [e.target.value]: oldVal } });
                    }}
                    placeholder="flag"
                  />
                  <FlagToggle
                    onClick={() => {
                      updateProject({
                        initialFlags: { ...project.initialFlags, [key]: !val },
                      });
                    }}
                    $active={val}
                  >
                    {val ? 'true' : 'false'}
                  </FlagToggle>
                  <DelBtn onClick={() => {
                    const { [key]: _, ...rest } = project.initialFlags;
                    updateProject({ initialFlags: rest });
                  }}>x</DelBtn>
                </StatRow>
              ))}
              <TerminalButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateProject({
                    initialFlags: { ...project.initialFlags, nuevo_flag: false },
                  });
                }}
              >
                + Agregar flag
              </TerminalButton>

              <TagInput
                label="Inventario inicial"
                tags={project.initialInventory}
                onChange={(initialInventory) => updateProject({ initialInventory })}
              />
            </Section>
          )}
        </ModalBody>

        <ModalFooter>
          <TerminalButton variant="primary" onClick={onClose}>
            Cerrar
          </TerminalButton>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
};

export default ProjectSettingsModal;

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
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
`;

const ModalTitle = styled.span`
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
  font-family: 'Courier New', monospace;
  font-size: 16px;
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px;
  background: ${(p) => (p.$active ? p.theme.terminal.dialogBackground : 'transparent')};
  border: none;
  border-bottom: 2px solid ${(p) => (p.$active ? p.theme.terminal.accent : 'transparent')};
  color: ${(p) => (p.$active ? p.theme.terminal.accent : p.theme.terminal.accentDim)};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  transition: all 0.15s;

  &:hover {
    background: ${(p) => p.theme.terminal.dialogBackground};
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const ModalFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${(p) => p.theme.terminal.border};
  display: flex;
  justify-content: flex-end;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SubTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.warning};
  text-transform: uppercase;
  font-weight: bold;
  margin-top: 8px;
`;

const CharBlock = styled.div`
  padding: 10px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CharHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CharId = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const StatRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const StatInput = styled.input`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;
  &:focus { border-color: ${(p) => p.theme.terminal.accent}; }
`;

const FlagToggle = styled.button<{ $active: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 4px 8px;
  background: ${(p) => (p.$active ? 'rgba(80,250,123,0.15)' : 'rgba(255,85,85,0.15)')};
  border: 1px solid ${(p) => (p.$active ? p.theme.terminal.success : p.theme.terminal.error)};
  color: ${(p) => (p.$active ? p.theme.terminal.success : p.theme.terminal.error)};
  cursor: pointer;
  border-radius: 2px;
  min-width: 55px;
`;

const DelBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 13px;
`;
