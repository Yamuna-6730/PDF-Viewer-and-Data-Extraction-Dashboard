import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Fetch the PDF from the backend API
    const backendUrl = `http://localhost:4000/api/upload/${fileId}/view`;
    
    console.log('Proxying PDF request:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      console.error('Backend response error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the PDF content as a buffer
    const pdfBuffer = await response.arrayBuffer();

    console.log('PDF fetched successfully, size:', pdfBuffer.byteLength);

    // Create response with proper headers for PDF viewing in iframe
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.byteLength.toString(),
      'Content-Disposition': 'inline; filename="document.pdf"',
      'Cache-Control': 'public, max-age=3600',
      // Explicitly DO NOT set X-Frame-Options to allow iframe embedding
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error while proxying PDF' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
