export function buildOgSvg(herName?: string | null) {
  const name = herName?.trim();
  const title = name ? `Algo especial para ${escapeXml(name)}` : "Nossa História";
  const subtitle = "Preparei algo só para você";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070014"/>
      <stop offset="50%" stop-color="#160C28"/>
      <stop offset="100%" stop-color="#21113A"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="#A855F7" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#A855F7" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C084FC"/>
      <stop offset="100%" stop-color="#F472B6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <circle cx="600" cy="230" r="72" fill="#F472B6" opacity="0.15"/>
  <path transform="translate(552,182) scale(2.2)" fill="#F472B6" d="M24 41.5c-.2 0-.4-.1-.5-.2-8.5-7.8-14-12.8-17.2-16.5C2.5 20.5 0 16.8 0 12.7 0 5.7 5.7 0 12.7 0c4 0 7.8 1.9 10.3 5.1C25.5 1.9 29.3 0 33.3 0 40.3 0 46 5.7 46 12.7c0 4.1-2.5 7.8-6.3 12.1-3.2 3.7-8.7 8.7-17.2 16.5-.1.1-.3.2-.5.2z"/>
  <text x="600" y="340" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-weight="600" fill="url(#text)">${title}</text>
  <text x="600" y="400" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-style="italic" fill="#D6C6FF" opacity="0.9">${escapeXml(subtitle)}</text>
  <text x="600" y="560" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" letter-spacing="6" fill="#A855F7" opacity="0.6">NOSSA HISTÓRIA</text>
</svg>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
