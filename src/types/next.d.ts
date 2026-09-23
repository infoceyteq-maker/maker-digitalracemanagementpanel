/**
 * Ambient type declarations for Next.js App Router and Edge Middleware
 */

declare module 'next/server' {
  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static next(init?: { request?: { headers?: Headers } }): NextResponse;
    cookies: {
      set(name: string, value: string, options?: any): void;
      get(name: string): { name: string; value: string } | undefined;
      delete(name: string): void;
    };
  }

  export class NextRequest extends Request {
    nextUrl: URL;
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
      set(name: string, value: string): void;
      delete(name: string): void;
    };
    ip?: string;
  }
}
