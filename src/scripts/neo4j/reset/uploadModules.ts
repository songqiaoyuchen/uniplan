import fs from "fs";
import path from "path";
import { connectToNeo4j, closeNeo4jConnection } from "../../../db/neo4j";
import { Neo4jModuleData } from "@/types/neo4jTypes";

export async function uploadModules(): Promise<void> {
  const filePath = path.join(process.cwd(), "src", "data", "moduleData.json");
  const moduleList: Neo4jModuleData[] = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  );

  const { driver, session } = await connectToNeo4j();

  try {
    const tx = session.beginTransaction();

    for (const mod of moduleList) {
      await tx.run(
        `MERGE (m:Module {moduleCode: $moduleCode})
         SET m.title = $title,
             m.description = $description,
             m.moduleCredit = $moduleCredit,
             m.department = $department,
             m.faculty = $faculty,
             m.workload = $workload,
             m.gradingBasisDescription = $gradingBasisDescription,
             m.prerequisite = $prerequisite,
             m.preclusion = $preclusion,
             m.attributes = $attributes,
             m.semesterData = $semesterData`,
        {
          moduleCode: mod.moduleCode,
          title: mod.title,
          description: mod.description,
          moduleCredit: mod.moduleCredit,
          department: mod.department,
          faculty: mod.faculty,
          workload: mod.workload ?? [],
          gradingBasisDescription: mod.gradingBasisDescription ?? null,
          prerequisite: mod.prerequisite ?? null,
          preclusion: mod.preclusion ?? null,
          attributes: JSON.stringify(mod.attributes ?? {}), // Neo4j node properties can only hold primitive values or arrays of primitives
          semesterData: JSON.stringify(mod.semesterData ?? []),
        },
      );

      console.log(`✅ Uploaded ${mod.moduleCode}`);
    }

    await tx.commit();
    console.log(`🎉 Uploaded ${moduleList.length} modules.`);
  } catch (err) {
    console.error("❌ Error during module upload:", err);
  } finally {
    await closeNeo4jConnection(driver, session);
  }
}

if (require.main === module) {
  uploadModules().catch((err) => {
    console.error("❌ Failed to upload modules:", err);
    process.exit(1);
  });
}
