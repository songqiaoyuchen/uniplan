import { fetchModuleData } from "../../scrapers/fetchModuleData";
import { fetchPrereqInfo } from "../../scrapers/fetchPrereqInfo";

import { saveMiniModuleData } from "../../scrapers/saveMiniModuleData";
import { saveModuleData } from "../../scrapers/saveModuleData";
import { savePrereqInfo } from "../../scrapers/savePrereqInfo";

export async function downloadData() {
  console.log("📡 Starting full NUSMods data scrape...");

  const { full, mini } = await fetchModuleData();
  await saveModuleData(full);
  await saveMiniModuleData(mini);

  const prereqInfo = await fetchPrereqInfo();
  await savePrereqInfo(prereqInfo);

  console.log("✅ All NUSMods data fetched and saved.");
}

if (require.main === module) {
  downloadData().catch((error) => {
    console.error("❌ Failed to download data:", error);
    process.exit(1);
  });
}
