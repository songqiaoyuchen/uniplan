import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'sampleTimetable.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const timetable = JSON.parse(jsonData);

    return NextResponse.json(timetable);
  } catch (error) {
    console.error('Failed to load sampleTimetable.json:', error);
    return NextResponse.json(
      { error: 'Failed to load timetable data' },
      { status: 500 }
    );
  }
}
