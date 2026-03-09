// editor/components/toolbar/ProjectSettingsModal.tsx
// Modal de configuración del proyecto: nombre, personajes, stats

import React, { useState } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import TerminalInput from '../shared/TerminalInput';
import TerminalButton from '../shared/TerminalButton';
import TagInput from '../shared/TagInput';
import AssetPicker from '../shared/AssetPicker';
import type { CharacterDef, CharacterRole, ItemDef, SkillTreeDef, SkillDef, TraitDef } from '../../../types/game';

const ROLE_OPTIONS: { value: CharacterRole; label: string; hint: string }[] = [
  { value: 'npc', label: 'NPC', hint: 'Personaje normal del mundo' },
  { value: 'narrator', label: 'Narrador', hint: 'Habla en estilo sistema, sin avatar en barra' },
  { value: 'protagonist', label: 'Protagonista', hint: 'Su imagen aparece en la barra de estado' },
  { value: 'companion', label: 'Compañero', hint: 'Aparece junto al protagonista cuando se une' },
];

interface ProjectSettingsModalProps {
  onClose: () => void;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ onClose }) => {
  const project = useEditorStore((s) => s.project);
  const updateProject = useEditorStore((s) => s.updateProject);
  const [tab, setTab] = useState<'general' | 'characters' | 'items' | 'stats' | 'skills' | 'traits'>('general');

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
          <Tab $active={tab === 'items'} onClick={() => setTab('items')}>Items</Tab>
          <Tab $active={tab === 'stats'} onClick={() => setTab('stats')}>Stats</Tab>
          <Tab $active={tab === 'skills'} onClick={() => setTab('skills')}>Skills</Tab>
          <Tab $active={tab === 'traits'} onClick={() => setTab('traits')}>Rasgos</Tab>
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
              {Object.entries(project.characters).map(([id, char]) => {
                const updateChar = (patch: Partial<CharacterDef>) => {
                  updateProject({
                    characters: { ...project.characters, [id]: { ...char, ...patch } },
                  });
                };
                const role = char.role || 'npc';
                return (
                  <CharBlock key={id}>
                    <CharHeader>
                      <CharId>{id}</CharId>
                      <RoleBadge $role={role}>{ROLE_OPTIONS.find(r => r.value === role)?.label || role}</RoleBadge>
                      <DelBtn onClick={() => {
                        const { [id]: _, ...rest } = project.characters;
                        updateProject({ characters: rest });
                      }}>x</DelBtn>
                    </CharHeader>

                    <TerminalInput
                      label="Nombre"
                      value={char.name}
                      onChange={(name) => updateChar({ name })}
                    />
                    <TerminalInput
                      label="Descripción"
                      value={char.description}
                      onChange={(description) => updateChar({ description })}
                    />

                    {/* Rol */}
                    <FieldGroup>
                      <FieldLabel>Rol</FieldLabel>
                      <RoleSelect
                        value={role}
                        onChange={(e) => updateChar({ role: e.target.value as CharacterRole })}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </RoleSelect>
                      <RoleHint>{ROLE_OPTIONS.find(r => r.value === role)?.hint}</RoleHint>
                    </FieldGroup>

                    {/* Imagen principal */}
                    <FieldGroup>
                      <FieldLabel>Imagen</FieldLabel>
                      <AssetPicker
                        value={char.image || ''}
                        onChange={(image) => updateChar({ image: image || undefined })}
                      />
                    </FieldGroup>

                    {/* Compañero: flag de unión */}
                    {role === 'companion' && (
                      <FieldGroup>
                        <FieldLabel>Flag de unión</FieldLabel>
                        <TerminalInput
                          value={char.joinFlag || ''}
                          onChange={(joinFlag) => updateChar({ joinFlag: joinFlag || undefined })}
                          placeholder="ej: nerly_joined"
                        />
                        <RoleHint>Cuando este flag sea true, el compañero aparece en la barra de estado junto al protagonista</RoleHint>
                      </FieldGroup>
                    )}

                    {/* Skill tree (protagonista/compañero) */}
                    {(role === 'protagonist' || role === 'companion') && (
                      <>
                        <FieldGroup>
                          <FieldLabel>Árbol de habilidades</FieldLabel>
                          <RoleSelect
                            value={char.skillTree || ''}
                            onChange={(e) => updateChar({ skillTree: e.target.value || undefined })}
                          >
                            <option value="">Ninguno</option>
                            {Object.keys(project.skillTrees || {}).map((treeId) => (
                              <option key={treeId} value={treeId}>{project.skillTrees[treeId].name}</option>
                            ))}
                          </RoleSelect>
                        </FieldGroup>
                        <FieldGroup>
                          <FieldLabel>Nivel máximo</FieldLabel>
                          <StatInput
                            type="number"
                            min={1}
                            value={char.maxLevel || 10}
                            onChange={(e) => updateChar({ maxLevel: parseInt(e.target.value) || 10 })}
                            style={{ width: 60 }}
                          />
                        </FieldGroup>
                        <FieldGroup>
                          <FieldLabel>Curva XP (separado por comas)</FieldLabel>
                          <StatInput
                            value={(char.xpCurve || [100, 200, 400, 800]).join(', ')}
                            onChange={(e) => {
                              const nums = e.target.value.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
                              updateChar({ xpCurve: nums.length ? nums : undefined });
                            }}
                            placeholder="100, 200, 400, 800"
                          />
                        </FieldGroup>
                      </>
                    )}

                    {/* Protagonista: imágenes alternativas */}
                    {role === 'protagonist' && (
                      <FieldGroup>
                        <FieldLabel>Imágenes alternativas</FieldLabel>
                        <RoleHint>
                          El jugador puede elegir entre estas imágenes. Usa un step de tipo "choice" con efecto stats: {'{'}"_protagonist_image": "ruta"{'}'} para cambiar la imagen del protagonista.
                        </RoleHint>
                        {Object.entries(char.altImages || {}).map(([altKey, altPath]) => (
                          <AltImageRow key={altKey}>
                            <AltImageLabel
                              value={altKey}
                              onChange={(e) => {
                                const { [altKey]: val, ...rest } = char.altImages || {};
                                updateChar({ altImages: { ...rest, [e.target.value]: val } });
                              }}
                              placeholder="etiqueta"
                            />
                            <AssetPicker
                              value={altPath}
                              onChange={(newPath) => {
                                updateChar({
                                  altImages: { ...(char.altImages || {}), [altKey]: newPath },
                                });
                              }}
                            />
                            <DelBtn onClick={() => {
                              const { [altKey]: _, ...rest } = char.altImages || {};
                              updateChar({ altImages: Object.keys(rest).length ? rest : undefined });
                            }}>x</DelBtn>
                          </AltImageRow>
                        ))}
                        <TerminalButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const altKey = `opcion_${Object.keys(char.altImages || {}).length + 1}`;
                            updateChar({
                              altImages: { ...(char.altImages || {}), [altKey]: '' },
                            });
                          }}
                        >
                          + Agregar imagen alternativa
                        </TerminalButton>
                      </FieldGroup>
                    )}
                  </CharBlock>
                );
              })}
              <TerminalButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newId = `personaje_${Object.keys(project.characters).length + 1}`;
                  const newChar: CharacterDef = { name: 'Nuevo Personaje', description: '', role: 'npc' };
                  updateProject({
                    characters: { ...project.characters, [newId]: newChar },
                  });
                }}
              >
                + Agregar personaje
              </TerminalButton>
            </Section>
          )}

          {tab === 'items' && (
            <Section>
              <RoleHint>
                Define los items que pueden aparecer en el inventario. El ID debe coincidir con el que usas en effects.inventory.
              </RoleHint>
              {Object.entries(project.items || {}).map(([id, item]) => {
                const updateItem = (patch: Partial<ItemDef>) => {
                  updateProject({
                    items: { ...project.items, [id]: { ...item, ...patch } },
                  });
                };
                return (
                  <CharBlock key={id}>
                    <CharHeader>
                      <CharId>{id}</CharId>
                      <DelBtn onClick={() => {
                        const { [id]: _, ...rest } = project.items;
                        updateProject({ items: rest });
                      }}>x</DelBtn>
                    </CharHeader>
                    <TerminalInput
                      label="Nombre"
                      value={item.name}
                      onChange={(name) => updateItem({ name })}
                    />
                    <TerminalInput
                      label="Descripción"
                      value={item.description}
                      onChange={(description) => updateItem({ description })}
                      multiline
                      rows={2}
                    />
                    <FieldGroup>
                      <FieldLabel>Imagen</FieldLabel>
                      <AssetPicker
                        value={item.image || ''}
                        onChange={(image) => updateItem({ image: image || undefined })}
                        accept="image"
                      />
                    </FieldGroup>
                  </CharBlock>
                );
              })}
              <TerminalButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newId = `item_${Object.keys(project.items || {}).length + 1}`;
                  const newItem: ItemDef = { name: 'Nuevo Item', description: 'Un objeto misterioso.' };
                  updateProject({
                    items: { ...(project.items || {}), [newId]: newItem },
                  });
                }}
              >
                + Agregar item
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
          {tab === 'skills' && (
            <Section>
              <RoleHint>
                Define árboles de habilidades. Asígnalos a personajes en la pestaña "Personajes".
              </RoleHint>
              {Object.entries(project.skillTrees || {}).map(([treeId, tree]) => {
                const updateTree = (patch: Partial<SkillTreeDef>) => {
                  updateProject({
                    skillTrees: { ...project.skillTrees, [treeId]: { ...tree, ...patch } },
                  });
                };
                return (
                  <CharBlock key={treeId}>
                    <CharHeader>
                      <CharId>{treeId}</CharId>
                      <DelBtn onClick={() => {
                        const { [treeId]: _, ...rest } = project.skillTrees;
                        updateProject({ skillTrees: rest });
                      }}>x</DelBtn>
                    </CharHeader>
                    <TerminalInput
                      label="Nombre"
                      value={tree.name}
                      onChange={(name) => updateTree({ name })}
                    />
                    <TerminalInput
                      label="Descripción"
                      value={tree.description || ''}
                      onChange={(description) => updateTree({ description })}
                    />
                    <SubTitle>Habilidades</SubTitle>
                    {Object.entries(tree.skills).map(([skillId, skill]) => {
                      const updateSkill = (patch: Partial<SkillDef>) => {
                        updateTree({
                          skills: { ...tree.skills, [skillId]: { ...skill, ...patch } },
                        });
                      };
                      return (
                        <SkillBlock key={skillId}>
                          <StatRow>
                            <CharId>{skillId}</CharId>
                            <DelBtn onClick={() => {
                              const { [skillId]: _, ...rest } = tree.skills;
                              updateTree({ skills: rest });
                            }}>x</DelBtn>
                          </StatRow>
                          <TerminalInput
                            label="Nombre"
                            value={skill.name}
                            onChange={(name) => updateSkill({ name })}
                          />
                          <TerminalInput
                            label="Descripción"
                            value={skill.description}
                            onChange={(description) => updateSkill({ description })}
                          />
                          <StatRow>
                            <FieldLabel>Nivel max:</FieldLabel>
                            <StatInput
                              type="number"
                              min={1}
                              value={skill.maxLevel}
                              onChange={(e) => updateSkill({ maxLevel: parseInt(e.target.value) || 1 })}
                              style={{ width: 50 }}
                            />
                            <FieldLabel>Costo:</FieldLabel>
                            <StatInput
                              type="number"
                              min={1}
                              value={skill.cost ?? 1}
                              onChange={(e) => updateSkill({ cost: parseInt(e.target.value) || 1 })}
                              style={{ width: 50 }}
                            />
                          </StatRow>
                          <TerminalInput
                            label="Prerrequisitos (IDs, comas)"
                            value={(skill.prerequisites || []).join(', ')}
                            onChange={(val) => {
                              const prereqs = val.split(',').map((s) => s.trim()).filter(Boolean);
                              updateSkill({ prerequisites: prereqs.length ? prereqs : undefined });
                            }}
                          />
                          <TerminalInput
                            label="Icono"
                            value={skill.icon || ''}
                            onChange={(icon) => updateSkill({ icon: icon || undefined })}
                          />
                        </SkillBlock>
                      );
                    })}
                    <TerminalButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newId = `skill_${Object.keys(tree.skills).length + 1}`;
                        updateTree({
                          skills: {
                            ...tree.skills,
                            [newId]: { name: 'Nueva Habilidad', description: 'Descripción...', maxLevel: 3, cost: 1 },
                          },
                        });
                      }}
                    >
                      + Agregar habilidad
                    </TerminalButton>
                  </CharBlock>
                );
              })}
              <TerminalButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newId = `tree_${Object.keys(project.skillTrees || {}).length + 1}`;
                  updateProject({
                    skillTrees: {
                      ...(project.skillTrees || {}),
                      [newId]: { name: 'Nuevo Árbol', skills: {} },
                    },
                  });
                }}
              >
                + Agregar árbol de habilidades
              </TerminalButton>
            </Section>
          )}

          {tab === 'traits' && (
            <Section>
              <RoleHint>
                Define rasgos/estados que pueden aplicarse a personajes. Úsalos en effects con addTraits/removeTraits.
              </RoleHint>
              {Object.entries(project.traits || {}).map(([traitId, trait]) => {
                const updateTrait = (patch: Partial<TraitDef>) => {
                  updateProject({
                    traits: { ...project.traits, [traitId]: { ...trait, ...patch } },
                  });
                };
                return (
                  <CharBlock key={traitId}>
                    <CharHeader>
                      <CharId>{traitId}</CharId>
                      <DelBtn onClick={() => {
                        const { [traitId]: _, ...rest } = project.traits;
                        updateProject({ traits: rest });
                      }}>x</DelBtn>
                    </CharHeader>
                    <TerminalInput
                      label="Nombre"
                      value={trait.name}
                      onChange={(name) => updateTrait({ name })}
                    />
                    <TerminalInput
                      label="Descripción"
                      value={trait.description}
                      onChange={(description) => updateTrait({ description })}
                    />
                    <StatRow>
                      <TerminalInput
                        label="Icono"
                        value={trait.icon || ''}
                        onChange={(icon) => updateTrait({ icon: icon || undefined })}
                      />
                    </StatRow>
                    <StatRow>
                      <FieldLabel>Mod. dados:</FieldLabel>
                      <StatInput
                        type="number"
                        value={trait.diceModifier || 0}
                        onChange={(e) => updateTrait({ diceModifier: parseInt(e.target.value) || undefined })}
                        style={{ width: 50 }}
                      />
                      <FlagToggle
                        $active={trait.permanent ?? true}
                        onClick={() => updateTrait({ permanent: !trait.permanent })}
                      >
                        {trait.permanent !== false ? 'Permanente' : 'Temporal'}
                      </FlagToggle>
                    </StatRow>
                    {!trait.permanent && (
                      <StatRow>
                        <FieldLabel>Duración (escenas):</FieldLabel>
                        <StatInput
                          type="number"
                          min={1}
                          value={trait.duration || 5}
                          onChange={(e) => updateTrait({ duration: parseInt(e.target.value) || 5 })}
                          style={{ width: 50 }}
                        />
                      </StatRow>
                    )}
                    <SubTitle>Modificadores de stats</SubTitle>
                    {Object.entries(trait.statModifiers || {}).map(([stat, val]) => (
                      <StatRow key={stat}>
                        <StatInput
                          value={stat}
                          onChange={(e) => {
                            const { [stat]: oldVal, ...rest } = trait.statModifiers || {};
                            updateTrait({ statModifiers: { ...rest, [e.target.value]: oldVal } });
                          }}
                        />
                        <StatInput
                          type="number"
                          value={val}
                          onChange={(e) => {
                            updateTrait({
                              statModifiers: { ...(trait.statModifiers || {}), [stat]: parseInt(e.target.value) || 0 },
                            });
                          }}
                          style={{ width: 60 }}
                        />
                        <DelBtn onClick={() => {
                          const { [stat]: _, ...rest } = trait.statModifiers || {};
                          updateTrait({ statModifiers: Object.keys(rest).length ? rest : undefined });
                        }}>x</DelBtn>
                      </StatRow>
                    ))}
                    <TerminalButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updateTrait({
                          statModifiers: { ...(trait.statModifiers || {}), nueva_stat: 0 },
                        });
                      }}
                    >
                      + Mod. stat
                    </TerminalButton>
                  </CharBlock>
                );
              })}
              <TerminalButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newId = `trait_${Object.keys(project.traits || {}).length + 1}`;
                  updateProject({
                    traits: {
                      ...(project.traits || {}),
                      [newId]: { name: 'Nuevo Rasgo', description: 'Descripción del rasgo...', permanent: true },
                    },
                  });
                }}
              >
                + Agregar rasgo
              </TerminalButton>
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

const RoleBadge = styled.span<{ $role: string }>`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 2px;
  font-weight: bold;
  flex-shrink: 0;
  background: ${(p) =>
    p.$role === 'protagonist' ? 'rgba(198,125,255,0.2)' :
    p.$role === 'companion' ? 'rgba(80,250,123,0.2)' :
    p.$role === 'narrator' ? 'rgba(241,250,140,0.2)' :
    'rgba(255,255,255,0.1)'};
  color: ${(p) =>
    p.$role === 'protagonist' ? p.theme.terminal.accent :
    p.$role === 'companion' ? p.theme.terminal.success :
    p.$role === 'narrator' ? p.theme.terminal.warning :
    p.theme.terminal.accentDim};
  border: 1px solid ${(p) =>
    p.$role === 'protagonist' ? p.theme.terminal.accent :
    p.$role === 'companion' ? p.theme.terminal.success :
    p.$role === 'narrator' ? p.theme.terminal.warning :
    p.theme.terminal.border};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const RoleSelect = styled.select`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  &:focus { border-color: ${(p) => p.theme.terminal.accent}; }
`;

const RoleHint = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.accentDim};
  font-style: italic;
  line-height: 1.3;
`;

const SkillBlock = styled.div`
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed ${(p) => p.theme.terminal.border};
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AltImageRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const AltImageLabel = styled.input`
  width: 80px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 4px 6px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;
  flex-shrink: 0;
  &:focus { border-color: ${(p) => p.theme.terminal.accent}; }
`;
