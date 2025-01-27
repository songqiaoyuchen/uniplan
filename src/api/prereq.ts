import axios from 'axios';

const academicYear = "2024-2025";
const API_URL = `https://api.nusmods.com/v2/${academicYear}/`;

export async function getPrereq(moduleCode: string) {
    const url = `${API_URL}/modules/${moduleCode}.json`;

    try {
        const response = await axios.get(url);
        if (response.status == 200) {
            return response.data.prereqTree;
        } else {
            console.error("Unexpected Error -- getPrereq: ", response.data.error);
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error("Error fetching module data:", error);
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        } else {
            console.error("Unexpected Error -- getPrereq: ", error);
        }
    }
};