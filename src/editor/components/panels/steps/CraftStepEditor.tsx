// editor/components/panels/steps/CraftStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { CraftStep, CraftRecipe } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import TerminalButton from '../../shared/TerminalButton';
import GotoSelect from '../../shared/GotoSelect';
import EffectsEditor from './EffectsEditor';
import ConditionEditor from './ConditionEditor';

interface Props {
  step: CraftStep;
  onChange: (step: CraftStep) => void;
}

const CraftStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const updateRecipe = (index: number, patch: Partial<CraftRecipe>) => {
    const recipes = step.recipes.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange({ ...step, recipes });
  };

  const addIngredient = (recipeIndex: number) => {
    const recipe = step.recipes[recipeIndex];
    updateRecipe(recipeIndex, { ingredients: [...recipe.ingredients, ''] });
  };

  const updateIngredient = (recipeIndex: number, ingIndex: number, value: string) => {
    const recipe = step.recipes[recipeIndex];
    const ingredients = recipe.ingredients.map((ing, i) => (i === ingIndex ? value : ing));
    updateRecipe(recipeIndex, { ingredients });
  };

  const removeIngredient = (recipeIndex: number, ingIndex: number) => {
    const recipe = step.recipes[recipeIndex];
    updateRecipe(recipeIndex, { ingredients: recipe.ingredients.filter((_, i) => i !== ingIndex) });
  };

  return (
    <Wrapper>
      <TerminalInput
        label="Descripción"
        value={step.description || ''}
        onChange={(description) => onChange({ ...step, description: description || undefined })}
        placeholder="Combina objetos de tu inventario..."
      />
      <TerminalInput
        label="Texto fallo"
        value={step.failText || ''}
        onChange={(failText) => onChange({ ...step, failText: failText || undefined })}
        placeholder="Eso no tiene ningún sentido..."
      />

      <SubTitle>Items sobre la mesa</SubTitle>
      <SubLabel>Items disponibles en la estación de crafteo (separados del inventario)</SubLabel>
      {(step.tableItems || []).map((item, i) => (
        <Row key={i}>
          <TerminalInput
            label={`Mesa ${i + 1}`}
            value={item}
            onChange={(v) => {
              const tableItems = (step.tableItems || []).map((t, j) => (j === i ? v : t));
              onChange({ ...step, tableItems });
            }}
            placeholder="id_del_item"
          />
          <SmallDelBtn onClick={() => {
            const tableItems = (step.tableItems || []).filter((_, j) => j !== i);
            onChange({ ...step, tableItems: tableItems.length ? tableItems : undefined });
          }}>x</SmallDelBtn>
        </Row>
      ))}
      <TerminalButton variant="ghost" size="sm" onClick={() => {
        onChange({ ...step, tableItems: [...(step.tableItems || []), ''] });
      }}>
        + Item de mesa
      </TerminalButton>

      <SubTitle>Recetas</SubTitle>
      {step.recipes.map((recipe, ri) => (
        <RecipeBlock key={ri}>
          <RecipeHeader>
            <RecipeLabel>Receta #{ri + 1}</RecipeLabel>
            <DelBtn onClick={() => onChange({ ...step, recipes: step.recipes.filter((_, i) => i !== ri) })}>
              x
            </DelBtn>
          </RecipeHeader>

          <SubLabel>Acción</SubLabel>
          <Row>
            <Toggle $active={(recipe.action || 'combine') === 'combine'} onClick={() => updateRecipe(ri, { action: undefined, tool: undefined, substance: undefined, target: undefined })}>
              + Combinar
            </Toggle>
            <Toggle $active={recipe.action === 'use'} onClick={() => updateRecipe(ri, { action: 'use', substance: undefined, target: undefined })}>
              () Meter en
            </Toggle>
            <Toggle $active={recipe.action === 'apply'} onClick={() => updateRecipe(ri, { action: 'apply', tool: undefined })}>
              &gt; Aplicar
            </Toggle>
            <Toggle $active={recipe.action === 'cut'} onClick={() => updateRecipe(ri, { action: 'cut', substance: undefined })}>
              / Cortar
            </Toggle>
            <Toggle $active={recipe.action === 'chop'} onClick={() => updateRecipe(ri, { action: 'chop', substance: undefined })}>
              // Picar
            </Toggle>
          </Row>

          {/* use: tool + ingredients */}
          {recipe.action === 'use' && (
            <TerminalInput
              label="Herramienta (olla, alambique...)"
              value={recipe.tool || ''}
              onChange={(tool) => updateRecipe(ri, { tool: tool || undefined })}
              placeholder="id_herramienta"
            />
          )}

          {/* cut/chop: tool + target */}
          {(recipe.action === 'cut' || recipe.action === 'chop') && (
            <>
              <TerminalInput
                label="Herramienta (cuchillo, destornillador...)"
                value={recipe.tool || ''}
                onChange={(tool) => updateRecipe(ri, { tool: tool || undefined })}
                placeholder="id_herramienta"
              />
              <TerminalInput
                label="Objetivo"
                value={recipe.target || ''}
                onChange={(target) => updateRecipe(ri, { target: target || undefined })}
                placeholder="id_objetivo"
              />
            </>
          )}

          {/* apply: substance + target */}
          {recipe.action === 'apply' && (
            <>
              <TerminalInput
                label="Sustancia (grasa, veneno...)"
                value={recipe.substance || ''}
                onChange={(substance) => updateRecipe(ri, { substance: substance || undefined })}
                placeholder="id_sustancia"
              />
              <TerminalInput
                label="Objetivo"
                value={recipe.target || ''}
                onChange={(target) => updateRecipe(ri, { target: target || undefined })}
                placeholder="id_objetivo"
              />
            </>
          )}

          {/* combine/use: ingredients list */}
          {(recipe.action === undefined || recipe.action === 'combine' || recipe.action === 'use') && (
            <>
              <SubLabel>Ingredientes</SubLabel>
              {recipe.ingredients.map((ing, ii) => (
                <Row key={ii}>
                  <TerminalInput
                    label={`Item ${ii + 1}`}
                    value={ing}
                    onChange={(v) => updateIngredient(ri, ii, v)}
                    placeholder="id_del_item"
                  />
                  <SmallDelBtn onClick={() => removeIngredient(ri, ii)}>x</SmallDelBtn>
                </Row>
              ))}
              <TerminalButton variant="ghost" size="sm" onClick={() => addIngredient(ri)}>
                + Ingrediente
              </TerminalButton>
            </>
          )}

          <TerminalInput
            label="Item resultado principal"
            value={recipe.result}
            onChange={(result) => updateRecipe(ri, { result })}
            placeholder="id_item_resultante"
          />

          {/* Bonus results (for cut/chop that produce multiple items) */}
          <SubLabel>Items extra (cortar/desarmar produce varios)</SubLabel>
          {(recipe.bonusResults || []).map((br, bi) => (
            <Row key={bi}>
              <TerminalInput
                label={`Extra ${bi + 1}`}
                value={br}
                onChange={(v) => {
                  const bonusResults = (recipe.bonusResults || []).map((b, j) => (j === bi ? v : b));
                  updateRecipe(ri, { bonusResults });
                }}
                placeholder="id_item_extra"
              />
              <SmallDelBtn onClick={() => {
                const bonusResults = (recipe.bonusResults || []).filter((_, j) => j !== bi);
                updateRecipe(ri, { bonusResults: bonusResults.length ? bonusResults : undefined });
              }}>x</SmallDelBtn>
            </Row>
          ))}
          <TerminalButton variant="ghost" size="sm" onClick={() => {
            updateRecipe(ri, { bonusResults: [...(recipe.bonusResults || []), ''] });
          }}>
            + Item extra
          </TerminalButton>
          <TerminalInput
            label="Texto éxito"
            value={recipe.text}
            onChange={(text) => updateRecipe(ri, { text })}
            placeholder="¡Has creado una tirolina!"
            multiline
            rows={2}
          />

          <Row>
            <Toggle $active={recipe.consume !== false} onClick={() => updateRecipe(ri, { consume: recipe.consume === false ? undefined : false })}>
              {recipe.consume !== false ? 'Consumir items' : 'Mantener items'}
            </Toggle>
            {(recipe.action === 'use' || recipe.action === 'apply') && (
              <Toggle $active={recipe.consumeTool === true} onClick={() => updateRecipe(ri, { consumeTool: recipe.consumeTool ? undefined : true })}>
                {recipe.consumeTool ? 'Consumir herramienta' : 'Mantener herramienta'}
              </Toggle>
            )}
          </Row>

          <GotoSelect
            label="Ir a (al craftear)"
            value={recipe.goto || ''}
            onChange={(goto) => updateRecipe(ri, { goto: goto || undefined })}
          />
          <EffectsEditor
            effects={recipe.effects || {}}
            onChange={(effects) => updateRecipe(ri, { effects: Object.keys(effects).length ? effects : undefined })}
          />
        </RecipeBlock>
      ))}

      <TerminalButton variant="ghost" size="sm" onClick={() => {
        onChange({
          ...step,
          recipes: [...step.recipes, { ingredients: ['', ''], result: '', text: '¡Has creado algo!', consume: true }],
        });
      }}>
        + Receta
      </TerminalButton>

      <GotoSelect
        label="Ir a (al salir)"
        value={step.goto || ''}
        onChange={(goto) => onChange({ ...step, goto: goto || undefined })}
      />
      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default CraftStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SubTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.warning};
  text-transform: uppercase;
  font-weight: bold;
  margin-top: 4px;
`;

const SubLabel = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const RecipeBlock = styled.div`
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RecipeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RecipeLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const DelBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
`;

const SmallDelBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 2px;
`;

const Toggle = styled.button<{ $active: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 4px 8px;
  background: ${(p) => (p.$active ? 'rgba(80,250,123,0.15)' : 'transparent')};
  border: 1px solid ${(p) => (p.$active ? p.theme.terminal.success : p.theme.terminal.border)};
  color: ${(p) => (p.$active ? p.theme.terminal.success : p.theme.terminal.accentDim)};
  cursor: pointer;
  border-radius: 2px;
`;
