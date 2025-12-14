import { supabaseServer } from "@/services/supabase";
import crypto from "crypto";
import { NextResponse } from "next/server";

function hashSnapshot(snapshot: unknown) {
  const json = JSON.stringify(snapshot);
  return crypto
    .createHash("sha256")
    .update("uniplan:v1:" + json)
    .digest("base64url")
    .slice(0, 16);
}

export async function POST(req: Request) {
  const data = await req.json();
  const id = hashSnapshot(data);

  const { error } = await supabaseServer
    .from("timetable_snapshots")
    .insert({ id, data })
    .select("id")
    .single();

  if (error && error.code !== "23505") {
    // 23505 = unique_violation (duplicate key)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Always succeed, even if duplicate
  return NextResponse.json({ id });
}
