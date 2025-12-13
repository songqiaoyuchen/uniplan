// src/app/api/snapshot/[id]/route.ts
import { supabaseServer } from "@/services/supabase";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const paramsResolved = await context.params;
  const id = paramsResolved.id;

  const { data, error } = await supabaseServer
    .from("timetable_snapshots")
    .select("data")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data.data);
}
