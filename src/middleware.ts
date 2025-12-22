import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Main domain patterns
  const isLocalhost = hostname.includes('localhost');
  const isVercelPreview = hostname.endsWith('.vercel.app');
  const isMainDomain = hostname === 'writine.com' || hostname === 'www.writine.com';
  
  // Check for subdomain (username.writine.com)
  const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.writine\.com$/i);
  const isSubdomain = subdomainMatch && !['www', 'api', 'app'].includes(subdomainMatch[1]);

  // Handle subdomain routing (username.writine.com)
  if (isSubdomain && subdomainMatch) {
    const username = subdomainMatch[1];
    const path = url.pathname;
    // Rewrite to /u/[username]/[...slug] to serve user's blog
    url.pathname = `/u/${username}${path}`;
    return NextResponse.rewrite(url);
  }

  // Handle custom domain routing (user's own domain)
  if (!isMainDomain && !isLocalhost && !isVercelPreview && !isSubdomain) {
    const path = url.pathname;
    // Rewrite to /d/[domain]/[...slug] to serve custom domain content
    url.pathname = `/d/${hostname}${path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next (Next.js internals)
     * - static files (images, etc)
     * - favicon, icons, manifest
     * - known app routes (dashboard, login, etc)
     */
    '/((?!api|_next|.*\\..*|dashboard|login|signup|profile|billing|domains|templates|analytics|blog|auth|site|sites).*)',
  ],
};
