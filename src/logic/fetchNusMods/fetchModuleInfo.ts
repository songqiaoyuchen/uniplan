import axios from 'axios';

const academicYear = "2024-2025";
const API_URL = `https://api.nusmods.com/v2/${academicYear}/`;

export async function fetchModuleInfo() {
    const url = `${API_URL}moduleInfo.json`;

    try {
        const response = await axios.get(url);
        if (response.status == 200) {
            return response.data;
        } else {
            console.error("Unexpected Error -- getModuleInfo: ", response.data.error);
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error("Error fetching module data:", error);
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        } else {
            console.error("Unexpected Error -- getModuleInfo: ", error);
        }
    }
};