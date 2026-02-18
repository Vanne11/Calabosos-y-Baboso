// editor/utils/validation.ts
// Validación del proyecto del editor

import type { SceneFlowNode, ValidationIssue, EditorProject } from '../types/editor';

export function validateProject(
  project: EditorProject,
  nodes: SceneFlowNode[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sceneIds = new Set(nodes.map((n) => n.data.sceneId));

  // Escena "start" obligatoria
  if (!sceneIds.has('start')) {
    issues.push({
      severity: 'error',
      message: 'Falta la escena "start". Es obligatoria.',
    });
  }

  for (const node of nodes) {
    const { sceneId, scene } = node.data;

    // Escenas sin steps
    if (scene.sequence.length === 0) {
      issues.push({
        severity: 'warning',
        message: `La escena "${sceneId}" no tiene pasos.`,
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
      }

      // Gotos que apuntan a escenas inexistentes
      if (step.type === 'choice') {
        for (const opt of step.options) {
          if (opt.goto && !sceneIds.has(opt.goto)) {
            issues.push({
              severity: 'error',
              message: `La escena "${sceneId}" tiene un goto a "${opt.goto}" que no existe.`,
              sceneId,
              stepIndex: i,
            });
          }
        }
      }

      if (step.type === 'dice') {
        const results = step.results;
        for (const [key, outcome] of Object.entries(results)) {
          if (outcome?.goto && !sceneIds.has(outcome.goto)) {
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
      }

      if (step.type === 'input' && step.goto && !sceneIds.has(step.goto)) {
        issues.push({
          severity: 'error',
          message: `La escena "${sceneId}" tiene un input con goto "${step.goto}" que no existe.`,
          sceneId,
          stepIndex: i,
        });
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
