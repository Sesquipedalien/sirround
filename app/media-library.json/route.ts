import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'media-library.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error reading media-library.json:', error);
    return NextResponse.json(
      { error: 'Failed to load media library' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-static';
