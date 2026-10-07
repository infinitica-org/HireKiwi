import { NextResponse } from 'next/server';

export function GET() {
  return new NextResponse(
    `<!DOCTYPE html><html><body><script>
try {
  sessionStorage.removeItem('hirekiwi.accessToken');
  localStorage.removeItem('hirekiwi.accessToken');
} catch (e) {}
</script></body></html>`,
    {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}
