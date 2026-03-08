// editor/utils/validation.ts
// Validación del proyecto del editor

import type { SceneFlowNode, ValidationIssue, EditorProject } from '../types/editor';
import { getNodeDestinations } from '../types/editor';
import { SPECIAL_IDS } from '../components/canvas/SpecialNode';

export function validateProject(
  project: EditorProject,
  nodes: SceneFlowNode[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allNodeIds = new Set(nodes.map((n) => n.data.sceneId));
  // sceneIds = solo escenas reales (no especiales)
  const sceneIds = new Set(nodes.filter((n) => n.type !== 'specialNode').map((n) => n.data.sceneId));
  // validDestinations = escenas + destinos especiales del sistema
  const validDestinations = new Set([...sceneIds, ...SPECIAL_IDS]);

  // Escena "start" obligatoria
  if (!sceneIds.has('start')) {
    issues.push({
      severity: 'error',
      message: 'Falta la escena "start". Es obligatoria.',
    });
  }

  // Escenas huérfanas (sin entrada desde otra escena, excepto start)
  const allDestinations = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'specialNode') continue;
    for (const dest of getNodeDestinations(node.data.scene.sequence)) {
      allDestinations.add(dest);
    }
  }

  for (const node of nodes) {
    // Skip special nodes (they have no sequence)
    if (node.type === 'specialNode') continue;

    const { sceneId, scene } = node.data;

    // Escenas sin steps
    if (scene.sequence.length === 0) {
      issues.push({
        severity: 'warning',
        message: `La escena "${sceneId}" no tiene pasos.`,
        sceneId,
      });
    }

    // Escena huérfana
    if (!node.data.isStart && !allDestinations.has(sceneId)) {
      issues.push({
        severity: 'warning',
        message: `La escena "${sceneId}" es huérfana (ninguna escena apunta a ella).`,
        sceneId,
      });
    }

    // Verificar cada step
    for (let i = 0; i < scene.sequence.length; i++) {
      const step = scene.sequence[i];

      // Personajes usados pero no definidos
      if (step.type === 'dialog') {
        if (!project.characters[step.character]) {
          issues.push({
            severity: 'warning',
            message: `La escena "${sceneId}" usa el personaje "${step.character}" que no está definido.`,
            sceneId,
            stepIndex: i,
          });
        }

        // Líneas vacías
        const emptyLines = step.lines.filter((l) => !l.trim() || l.trim() === '...').length;
        if (emptyLines > 0) {
          issues.push({
            severity: 'warning',
            message: `La escena "${sceneId}" tiene ${emptyLines} línea(s) de diálogo vacías.`,
            sceneId,
            stepIndex: i,
          });
        }
      }

      // Gotos que apuntan a escenas inexistentes
      if (step.type === 'choice') {
        for (const opt of step.options) {
          if (opt.goto && !validDestinations.has(opt.goto)) {
            issues.push({
              severity: 'error',
              message: `La escena "${sceneId}" tiene un goto a "${opt.goto}" que no existe.`,
              sceneId,
              stepIndex: i,
            });
          }
          // Texto de opción vacío
          if (!opt.text.trim()) {
            issues.push({
              severity: 'warning',
              message: `La escena "${sceneId}" tiene una opción sin texto.`,
              sceneId,
              stepIndex: i,
            });
          }
        }
      }

      if (step.type === 'dice') {
        const results = step.results;
        for (const [key, outcome] of Object.entries(results)) {
          if (outcome?.goto && !validDestinations.has(outcome.goto)) {
            issues.push({
              severity: 'error',
              message: `La escena "${sceneId}" tiene un dado con goto "${outcome.goto}" (${key}) que no existe.`,
              sceneId,
              stepIndex: i,
            });
          }
        }

        // Stats usadas en dados pero no definidas
        if (!(step.stat in project.initialStats)) {
          issues.push({
            severity: 'warning',
            message: `La escena "${sceneId}" usa la stat "${step.stat}" en un dado, pero no está definida en las stats iniciales.`,
            sceneId,
            stepIndex: i,
          });
        }

        // Dificultad fuera de rango
        if (step.difficulty < 1 || step.difficulty > step.faces) {
          issues.push({
            severity: 'warning',
            message: `La escena "${sceneId}" tiene una dificultad (${step.difficulty}) fuera del rango del dado (1-${step.faces}).`,
            sceneId,
            stepIndex: i,
          });
        }
      }

      if (step.type === 'input' && step.goto && !validDestinations.has(step.goto)) {
        issues.push({
          severity: 'error',
          message: `La escena "${sceneId}" tiene un input con goto "${step.goto}" que no existe.`,
          sceneId,
          stepIndex: i,
        });
      }

      // Validar nuevos tipos de step
      if (step.type === 'branch') {
        if (step.branches.length === 0) {
          issues.push({
            severity: 'warning',
            message: `La escena "${sceneId}" tiene una bifurcación sin ramas.`,
            sceneId, stepIndex: i,
          });
        }
        for (const branch of step.branches) {
          if (branch.goto && !validDestinations.has(branch.goto)) {
            issues.push({
              severity: 'error',
              message: `La escena "${sceneId}" tiene una bifurcación con goto "${branch.goto}" que no existe.`,
              sceneId, stepIndex: i,
            });
          }
        }
      }

      if (step.type === 'random') {
        if (step.outcomes.length === 0) {
          issues.push({
            severity: 'warning',
            message: `La escena "${sceneId}" tiene un paso aleatorio sin resultados.`,
            sceneId, stepIndex: i,
          });
        }
        for (const outcome of step.outcomes) {
          if (outcome.goto && !validDestinations.has(outcome.goto)) {
            issues.push({
              severity: 'error',
              message: `La escena "${sceneId}" tiene un paso aleatorio con goto "${outcome.goto}" que no existe.`,
              sceneId, stepIndex: i,
            });
          }
        }
      }

      if (step.type === 'check') {
        if (!(step.stat in project.initialStats)) {
          issues.push({
            severity: 'warning',
            message: `La escena "${sceneId}" usa la stat "${step.stat}" en comprobación pero no está en stats iniciales.`,
            sceneId, stepIndex: i,
          });
        }
        if (step.success.goto && !validDestinations.has(step.success.goto)) {
          issues.push({ severity: 'error', message: `"${sceneId}" check éxito goto "${step.success.goto}" no existe.`, sceneId, stepIndex: i });
        }
        if (step.failure.goto && !validDestinations.has(step.failure.goto)) {
          issues.push({ severity: 'error', message: `"${sceneId}" check fallo goto "${step.failure.goto}" no existe.`, sceneId, stepIndex: i });
        }
      }

      if (step.type === 'shop') {
        if (step.items.length === 0) {
          issues.push({ severity: 'warning', message: `La escena "${sceneId}" tiene una tienda sin items.`, sceneId, stepIndex: i });
        }
        if (step.goto && !validDestinations.has(step.goto)) {
          issues.push({ severity: 'error', message: `"${sceneId}" tienda goto "${step.goto}" no existe.`, sceneId, stepIndex: i });
        }
      }

      if (step.type === 'combat') {
        for (const [key, outcome] of Object.entries(step.results)) {
          if (outcome?.goto && !validDestinations.has(outcome.goto)) {
            issues.push({ severity: 'error', message: `"${sceneId}" combate ${key} goto "${outcome.goto}" no existe.`, sceneId, stepIndex: i });
          }
        }
        if (step.enemy.hp <= 0) {
          issues.push({ severity: 'warning', message: `La escena "${sceneId}" tiene un enemigo con 0 HP.`, sceneId, stepIndex: i });
        }
      }

      if (step.type === 'craft') {
        if (step.recipes.length === 0) {
          issues.push({ severity: 'warning', message: `"${sceneId}" tiene un crafteo sin recetas.`, sceneId, stepIndex: i });
        }
        for (const recipe of step.recipes) {
          if (recipe.ingredients.some((ing) => !ing.trim())) {
            issues.push({ severity: 'warning', message: `"${sceneId}" tiene una receta con ingredientes vacíos.`, sceneId, stepIndex: i });
          }
          if (!recipe.result.trim()) {
            issues.push({ severity: 'warning', message: `"${sceneId}" tiene una receta sin item resultado.`, sceneId, stepIndex: i });
          }
          if (recipe.goto && !validDestinations.has(recipe.goto)) {
            issues.push({ severity: 'error', message: `"${sceneId}" receta goto "${recipe.goto}" no existe.`, sceneId, stepIndex: i });
          }
        }
        if (step.goto && !validDestinations.has(step.goto)) {
          issues.push({ severity: 'error', message: `"${sceneId}" craft goto "${step.goto}" no existe.`, sceneId, stepIndex: i });
        }
      }

      if (step.type === 'puzzle') {
        if (step.success.goto && !validDestinations.has(step.success.goto)) {
          issues.push({ severity: 'error', message: `"${sceneId}" puzzle éxito goto "${step.success.goto}" no existe.`, sceneId, stepIndex: i });
        }
        if (step.failure.goto && !validDestinations.has(step.failure.goto)) {
          issues.push({ severity: 'error', message: `"${sceneId}" puzzle fallo goto "${step.failure.goto}" no existe.`, sceneId, stepIndex: i });
        }
      }

      if (step.type === 'examine') {
        if (step.subjects.length === 0) {
          issues.push({ severity: 'warning', message: `"${sceneId}" tiene un examinar sin objetos.`, sceneId, stepIndex: i });
        }
        if (step.goto && !validDestinations.has(step.goto)) {
          issues.push({ severity: 'error', message: `"${sceneId}" examine goto "${step.goto}" no existe.`, sceneId, stepIndex: i });
        }
      }

      if (step.type === 'use_item') {
        if (step.targets.length === 0) {
          issues.push({ severity: 'warning', message: `"${sceneId}" tiene un usar item sin objetivos.`, sceneId, stepIndex: i });
        }
        for (const target of step.targets) {
          for (const accept of target.accepts) {
            if (accept.goto && !validDestinations.has(accept.goto)) {
              issues.push({ severity: 'error', message: `"${sceneId}" use_item accept goto "${accept.goto}" no existe.`, sceneId, stepIndex: i });
            }
          }
        }
        if (step.goto && !validDestinations.has(step.goto)) {
          issues.push({ severity: 'error', message: `"${sceneId}" use_item goto "${step.goto}" no existe.`, sceneId, stepIndex: i });
        }
      }

      if (step.type === 'timed_choice') {
        if (step.options.length === 0) {
          issues.push({ severity: 'warning', message: `"${sceneId}" tiene un timed choice sin opciones.`, sceneId, stepIndex: i });
        }
        for (const opt of step.options) {
          if (opt.goto && !validDestinations.has(opt.goto)) {
            issues.push({ severity: 'error', message: `"${sceneId}" timed choice goto "${opt.goto}" no existe.`, sceneId, stepIndex: i });
          }
        }
        if (step.defaultIndex >= step.options.length) {
          issues.push({ severity: 'warning', message: `"${sceneId}" timed choice defaultIndex fuera de rango.`, sceneId, stepIndex: i });
        }
      }
    }

    // Escenas sin salida (sin goto en ningún step)
    const hasExit = scene.sequence.some((step) => {
      if (step.type === 'choice') return step.options.some((o) => !!o.goto);
      if (step.type === 'dice') {
        const r = step.results;
        return !!(r.success?.goto || r.failure?.goto || r.critical_success?.goto || r.critical_failure?.goto);
      }
      if (step.type === 'input') return !!step.goto;
      if (step.type === 'branch') return step.branches.some((b) => !!b.goto);
      if (step.type === 'random') return step.outcomes.some((o) => !!o.goto);
      if (step.type === 'check') return !!(step.success.goto || step.failure.goto);
      if (step.type === 'shop') return !!step.goto;
      if (step.type === 'combat') {
        const r = step.results;
        return !!(r.victory?.goto || r.defeat?.goto || r.flee?.goto);
      }
      if (step.type === 'craft') {
        return !!step.goto || step.recipes.some((r) => !!r.goto);
      }
      if (step.type === 'puzzle') {
        return !!(step.success.goto || step.failure.goto);
      }
      if (step.type === 'examine') return !!step.goto;
      if (step.type === 'use_item') {
        return !!step.goto || step.targets.some((t) => t.accepts.some((a) => !!a.goto));
      }
      if (step.type === 'timed_choice') return step.options.some((o) => !!o.goto);
      return false;
    });

    if (!hasExit && scene.sequence.length > 0) {
      issues.push({
        severity: 'warning',
        message: `La escena "${sceneId}" no tiene salida (ningún goto definido).`,
        sceneId,
      });
    }
  }

  return issues;
}
