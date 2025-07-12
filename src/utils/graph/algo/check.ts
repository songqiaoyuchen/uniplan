// check.ts
/**
 * Validates a generated timetable against scheduling constraints.
 * Checks for duplicate modules, prerequisite satisfaction,
 * credit limits, and target module completion.
 **/

import { NormalisedGraph, TimetableData, ValidationResult } from '@/types/graphTypes';
import { isNofNode, isModuleData, MAX_MCS_PER_SEMESTER } from './constants';

/**
 * Validates that a generated timetable satisfies all constraints
 */
export function validateSchedule(
  timetable: TimetableData[],
  graph: NormalisedGraph,
  targetModules: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Group by semester
  const bySemester = timetable.reduce((acc, item) => {
    if (!acc[item.semester]) acc[item.semester] = [];
    acc[item.semester].push(item);
    return acc;
  }, {} as Record<number, TimetableData[]>);

  // Track completed modules as we go through semesters
  const completedModules = new Set<string>();
  const moduleToNode = new Map<string, string>();
  const logicNodeStatus = new Map<string, { satisfied: boolean; count: number; requires: number }>();
  
  // Build module code to node ID mapping
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (isModuleData(node)) {
      moduleToNode.set(node.code, id);
    } else if (isNofNode(node)) {
      logicNodeStatus.set(id, { satisfied: false, count: 0, requires: node.n });
    }
  }

  // Check for duplicate modules
  const allModules = timetable.map(item => item.code);
  const duplicates = allModules.filter((code, index) => allModules.indexOf(code) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate modules scheduled: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Validate each semester
  let maxCredits = 0;
  const semesters = Object.keys(bySemester).map(Number).sort((a, b) => a - b);
  
  for (const semester of semesters) {
    const modules = bySemester[semester];
    let semesterCredits = 0;
    
    console.log(`\nValidating Semester ${semester}:`);

    for (const [logicId, node] of Object.entries(graph.nodes)) {
        if (!isNofNode(node)) continue;
        let count = 0;
        for (const edge of graph.edges.filter(e => e.from === logicId)) {
        const optionNode = graph.nodes[edge.to];
        if (isModuleData(optionNode) && completedModules.has(optionNode.code)) {
            count++;
        }
        if (isNofNode(optionNode) && logicNodeStatus.get(edge.to)?.satisfied) {
            count++;
        }
        }
        const status = logicNodeStatus.get(logicId);
        if (status) {
          status.satisfied = (count >= node.n);
          status.count = count;
        }
    }
    
    for (const { code } of modules) {
      const nodeId = moduleToNode.get(code);
      
      if (!nodeId) {
        errors.push(`Module ${code} in semester ${semester} not found in graph`);
        continue;
      }
      
      const node = graph.nodes[nodeId];
      if (!isModuleData(node)) {
        errors.push(`Node for ${code} is not a module`);
        continue;
      }
      
      const credits = node.credits || 4;
      semesterCredits += credits;
      
      // Check prerequisites
      const prereqs = graph.edges.filter(e => e.from === nodeId);
      for (const prereq of prereqs) {
        const prereqNode = graph.nodes[prereq.to];
        
        if (isNofNode(prereqNode)) {
          // Check if logic node is satisfied
          const logicStatus = logicNodeStatus.get(prereq.to);
          if (!logicStatus?.satisfied) {
            const logicNodeLabel = getLogicNodeLabel(graph, prereq.to);
            errors.push(`Module ${code} taken in semester ${semester} but prerequisite logic node ${logicNodeLabel} not satisfied`);
          }
        } else if (isModuleData(prereqNode)) {
          // Direct module prerequisite
          if (!completedModules.has(prereqNode.code)) {
            errors.push(`Module ${code} taken in semester ${semester} before prerequisite ${prereqNode.code}`);
          }
        }
      }
    }
    
    // Check credit limit
    if (semesterCredits > MAX_MCS_PER_SEMESTER) {
      errors.push(`Semester ${semester} has ${semesterCredits} MCs, exceeding limit of ${MAX_MCS_PER_SEMESTER}`);
    }
    
    maxCredits = Math.max(maxCredits, semesterCredits);
    console.log(`  Total credits: ${semesterCredits}/${MAX_MCS_PER_SEMESTER}`);
    
    // Mark modules as completed and update logic nodes
    for (const { code } of modules) {
      completedModules.add(code);
      const nodeId = moduleToNode.get(code);
      
      if (nodeId) {
        // Update any logic nodes that have this module as an option
        const logicParents = graph.edges
          .filter(e => e.to === nodeId && isNofNode(graph.nodes[e.from]))
          .map(e => e.from);
        
        for (const logicId of logicParents) {
          const status = logicNodeStatus.get(logicId);
          if (status && !status.satisfied) {
            status.count++;
            if (status.count >= status.requires) {
              status.satisfied = true;
              const logicNodeLabel = getLogicNodeLabel(graph, logicId);
            }
          }
        }
      }
    }
  }

  // Check if all target modules were completed
  const targetSet = new Set(targetModules);
  const completedTargets = targetModules.filter(code => completedModules.has(code));
  const missingTargets = targetModules.filter(code => !completedModules.has(code));
  
  if (missingTargets.length > 0) {
    errors.push(`Target modules not completed: ${missingTargets.join(', ')}`);
  }

  // Check for modules that appear in timetable but aren't in graph
  for (const { code } of timetable) {
    if (!moduleToNode.has(code)) {
      warnings.push(`Module ${code} in timetable but not found in graph`);
    }
  }

  // Check semester continuity
  if (semesters.length > 0) {
    for (let i = 1; i < semesters.length; i++) {
      if (semesters[i] !== semesters[i-1] + 1) {
        warnings.push(`Gap in semesters: ${semesters[i-1]} to ${semesters[i]}`);
      }
    }
  }

  const stats = {
    totalModules: timetable.length,
    totalSemesters: semesters.length,
    totalCredits: timetable.reduce((sum, item) => {
      const node = graph.nodes[moduleToNode.get(item.code) || ''];
      return sum + (isModuleData(node) ? (node.credits || 4) : 4);
    }, 0),
    maxCreditsInSemester: maxCredits,
    targetModulesCompleted: completedTargets.length,
    targetModulesTotal: targetModules.length
  };

  const isValid = errors.length === 0;

  console.log('\n=== Validation Summary ===');
  console.log(`Valid: ${isValid}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Stats:`, stats);

  return {
    isValid,
    errors,
    warnings,
    stats
  };
}

/**
 * Generates a detailed report of the validation results
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push('=== SCHEDULE VALIDATION REPORT ===\n');
  
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`);
  
  lines.push('Statistics:');
  lines.push(`  - Total modules: ${result.stats.totalModules}`);
  lines.push(`  - Total semesters: ${result.stats.totalSemesters}`);
  lines.push(`  - Total credits: ${result.stats.totalCredits}`);
  lines.push(`  - Max credits in a semester: ${result.stats.maxCreditsInSemester}/${MAX_MCS_PER_SEMESTER}`);
  lines.push(`  - Target modules completed: ${result.stats.targetModulesCompleted}/${result.stats.targetModulesTotal}`);
  lines.push('');
  
  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    result.errors.forEach((error, i) => {
      lines.push(`  ${i + 1}. ${error}`);
    });
    lines.push('');
  }
  
  if (result.warnings.length > 0) {
    lines.push(`Warnings (${result.warnings.length}):`);
    result.warnings.forEach((warning, i) => {
      lines.push(`  ${i + 1}. ${warning}`);
    });
    lines.push('');
  }
  
  lines.push('=== END OF REPORT ===');
  
  return lines.join('\n');
}

function getLogicNodeLabel(graph: NormalisedGraph, logicId: string): string {
  const logicNode = graph.nodes[logicId];
  if (logicNode && isNofNode(logicNode)) {
    const options = graph.edges
      .filter(e => e.from === logicId)
      .map(e => {
        const optNode = graph.nodes[e.to];
        if (isModuleData(optNode)) return optNode.code;
        if (isNofNode(optNode)) return `LOGIC-${e.to}`;
        return e.to;
      });
    return `LOGIC-${logicId} [needs ${logicNode.n} of: ${options.join(', ')}]`;
  }
  return `LOGIC-${logicId}`;
}