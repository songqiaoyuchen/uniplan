'use client';
import { getPrereq } from "@/api/prereq";
import { Button } from "@mui/material";

export default function Home() {

  async function handleClick() {
    try {
      const response = await getPrereq("CS2030S");
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <h1>Uni Planner</h1>
      <Button onClick={handleClick}>test</Button>
    </div>
  );
}
