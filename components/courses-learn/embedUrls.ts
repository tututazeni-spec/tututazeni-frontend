export function spotifyEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== 'open.spotify.com') return null;
    // aceita também /intl-pt/episode/ID
    const m = u.pathname.match(
      /\/(episode|track|show|playlist|album)\/([A-Za-z0-9]+)/,
    );
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
  } catch {
    return null;
  }
}