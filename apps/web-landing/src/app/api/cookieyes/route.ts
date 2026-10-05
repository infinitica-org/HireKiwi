export async function GET() {
  try {
    // Server-side proxy of a third-party script, not a SMART API call; api-client doesn't apply.
    // eslint-disable-next-line no-restricted-globals
    const res = await fetch(
      'https://cdn-cookieyes.com/client_data/be2546efcbf450059885daed3260170c/script.js',
      { cache: 'no-store' },
    );
    let script = await res.text();

    // In local development, bypass the domain restriction check so the banner renders on localhost
    script = script.replace(
      'currentDomain:window.location.hostname',
      'currentDomain:"becomesmart.online"',
    );

    return new Response(script, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(
      `console.warn("[CookieYes dev proxy error]", ${JSON.stringify(String(err))});`,
      {
        headers: { 'Content-Type': 'application/javascript' },
      },
    );
  }
}
