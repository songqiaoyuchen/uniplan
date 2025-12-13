import { supabaseServer } from "@/services/supabase";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();
  const id = nanoid(8);

  const { error } = await supabaseServer
    .from("timetable_snapshots")
    .insert({ id, data });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id });
}
