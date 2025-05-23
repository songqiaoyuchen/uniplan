/**
 * @author Kevin Zhang
 * @description Updates module nodes in Neo4j with metadata from moduleInformation.json, including title, credits, and offered semesters.
 * @created 2025-05-10
 */

import fs from 'fs';
import path from 'path';
import { connectToNeo4j, closeNeo4jConnection } from '../../db/neo4j';

type ModuleInfo = {
  moduleCode: string;
  title: string;
  description: string;
  moduleCredit: string;
  department: string;
  faculty: string;
  workload: number[];
  gradingBasisDescription: string;
  semesterData: any;
};

export async function updateModulesMetadata() {
  const filePath = path.join(process.cwd(), 'output', 'moduleInformation.json');
  const moduleList: ModuleInfo[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const { driver, session } = await connectToNeo4j();

  try {
    for (const mod of moduleList) {
      const offeredIn = Array.isArray(mod.semesterData)
        ? mod.semesterData
          .map((s) => s.semester)
          .filter((s) => typeof s === 'number' && !isNaN(s))
        : [];

      if (offeredIn.length === 0) {
        console.warn(`⚠️ ${mod.moduleCode} has no offered semesters.`);
      }

      const exists = await session.run(
        `MATCH (m:Module {code: $code}) RETURN m`,
        { code: mod.moduleCode }
      );

      if (exists.records.length === 0) {
        console.warn(`⚠️ No module found with code: ${mod.moduleCode}`);
        continue;
      }

      await session.run(
        `MATCH (m:Module {code: $code})
         SET m.title = $title,
             m.description = $description,
             m.moduleCredit = $credit,
             m.department = $dept,
             m.faculty = $faculty,
             m.workload = $workload,
             m.gradingBasisDescription = $grading,
             m.offeredIn = $offeredIn`,
        {
          code: mod.moduleCode,
          title: mod.title,
          description: mod.description,
          credit: mod.moduleCredit,
          dept: mod.department,
          faculty: mod.faculty,
          workload: Array.isArray(mod.workload) ? mod.workload : [],
          grading: mod.gradingBasisDescription,
          offeredIn,
        }
      );

      console.log(`✅ Updated ${mod.moduleCode} module.`);
    }

    console.log(`🎉 Updated ${moduleList.length} modules total.`);
  } catch (err) {
    console.error('❌ Error updating modules:', err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}
