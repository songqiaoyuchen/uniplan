/**
 * @author Kevin Zhang
 * @description Fetches prerequisite trees from NUSMods API
 * @created 2025-05-07
 */

import axios, { AxiosError } from 'axios';

const academicYear = "2024-2025";
const API_URL = `https://api.nusmods.com/v2/${academicYear}/modules/`;

export async function getPrereqTree(moduleCode: string): Promise<any> {
  try {
    const res = await axios.get(`${API_URL}${moduleCode}.json`);
    return res.data.prereqTree ?? null;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError;
      console.warn(`⚠️ Skipping ${moduleCode}:`, axiosErr.response?.status ?? axiosErr.message);
    } else {
      console.warn(`⚠️ Skipping ${moduleCode}: Unexpected error`, (err as Error).message);
    }
    return null;
  }
}
