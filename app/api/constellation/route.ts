import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generateOptimalConstellationElements } from '../../../lib/satellite-utils';

interface ConstellationRequest {
  numSatellites: number;
  numPlanes: number;
  altitudesPerPlane: number[] | number; // Accept both array and single number
}

// Simple in-memory store for latest constellation parameters
let latestConstellation: {
  params: { numSatellites: number; numPlanes: number; altitudesPerPlane: number[] };
  timestamp: number;
} | null = null;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: unknown = await request.json();
    
    // Basic type validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected JSON object.' },
        { status: 400 }
      );
    }

    const { numSatellites, numPlanes, altitudesPerPlane } = body as Partial<ConstellationRequest>;

    // Validate required fields
    if (typeof numSatellites !== 'number') {
      return NextResponse.json(
        { success: false, error: 'numSatellites is required and must be a number.' },
        { status: 400 }
      );
    }

    if (typeof numPlanes !== 'number') {
      return NextResponse.json(
        { success: false, error: 'numPlanes is required and must be a number.' },
        { status: 400 }
      );
    }

    // Validate altitudesPerPlane - accept both number and array
    if (typeof altitudesPerPlane !== 'number' && !Array.isArray(altitudesPerPlane)) {
      return NextResponse.json(
        { success: false, error: 'altitudesPerPlane is required and must be a number or array of numbers.' },
        { status: 400 }
      );
    }

    // Convert single number to array, or validate array
    let altitudesArray: number[];
    if (typeof altitudesPerPlane === 'number') {
      // Single altitude - apply to all planes
      altitudesArray = new Array<number>(numPlanes).fill(altitudesPerPlane);
    } else {
      // Array provided - validate it contains only numbers
      if (!altitudesPerPlane.every(alt => typeof alt === 'number')) {
        return NextResponse.json(
          { success: false, error: 'All values in altitudesPerPlane array must be numbers.' },
          { status: 400 }
        );
      }
      altitudesArray = altitudesPerPlane;
    }

    // Generate constellation (this will throw detailed errors if validation fails)
    const elements = generateOptimalConstellationElements(
      numSatellites,
      numPlanes,
      altitudesArray
    );

    // Store the parameters for frontend polling (always store as array for consistency)
    latestConstellation = {
      params: { numSatellites, numPlanes, altitudesPerPlane: altitudesArray },
      timestamp: Date.now()
    };

    console.log(`[API] Successfully generated constellation: ${elements.length} satellites`);
    console.log(`[API] Stored parameters for frontend polling:`, latestConstellation.params);

    return NextResponse.json({ success: true });

  } catch (error) {
    // Handle validation errors from generateOptimalConstellationElements
    if (error instanceof Error) {
      console.error(`[API] Constellation generation failed: ${error.message}`);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return the latest constellation parameters for frontend polling
  return NextResponse.json({
    success: true,
    data: latestConstellation
  });
} 