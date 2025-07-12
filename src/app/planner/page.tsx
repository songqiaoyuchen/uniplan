// src/app/page.tsx
"use client";

import { useAppDispatch } from "@/store";
import PlannerContainer from "./components/PlannerContainer";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { moduleSelected } from "@/store/timetableSlice";

export default function PlannerPage() {
  const dispatch = useAppDispatch();
  const params = useSearchParams();

  useEffect(() => {
    const moduleCode = params.get("module");
    if (moduleCode) {
      dispatch(moduleSelected(moduleCode));
    }
  }, [params, dispatch]);
  
  return (
    <main>
      <PlannerContainer />
    </main>
  );
}
