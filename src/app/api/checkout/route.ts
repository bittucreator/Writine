import { Checkout } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const handler = Checkout({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true`,
      server: 'production', // Use production
    });
    
    return handler(req);
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: 'Checkout failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
