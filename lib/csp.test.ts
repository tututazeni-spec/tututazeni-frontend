import { describe, expect, it } from 'vitest';
import { buildCsp, parseImageHosts, resolveJitsiDomain } from './csp';

const base = { nonce: 'abc123', isDev: false, imageHosts: [] as string[] };
const directive = (csp: string, name: string) =>
  csp.split('; ').find((d) => d.startsWith(name))!;

describe('buildCsp', () => {
  it('script-src usa nonce e nunca unsafe-inline', () => {
    const script = directive(buildCsp(base), 'script-src');
    expect(script).toContain("'nonce-abc123'");
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
  });

  it('unsafe-eval só em dev', () => {
    expect(buildCsp({ ...base, isDev: true })).toContain("'unsafe-eval'");
  });

  it('bloqueia enquadramento e plugins, e força upgrade de http', () => {
    const csp = buildCsp(base);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'self' blob:");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('permite os embeds de vídeo e o Jitsi', () => {
    const frame = directive(buildCsp(base), 'frame-src');
    for (const h of ['www.youtube.com', 'player.vimeo.com', 'drive.google.com', 'meet.jit.si']) {
      expect(frame).toContain(`https://${h}`);
    }
  });

  it('sem imageHosts mantém qualquer https; com hosts restringe', () => {
    expect(directive(buildCsp(base), 'img-src').split(' ')).toContain('https:');
    const img = directive(buildCsp({ ...base, imageHosts: ['storage.innova.ao'] }), 'img-src');
    expect(img).toContain('https://storage.innova.ao');
    expect(img).toContain('https://img.youtube.com');
    expect(img.split(' ')).not.toContain('https:');
  });

  it('não permite http:// em nenhuma directiva', () => {
    expect(buildCsp(base)).not.toMatch(/(^|[ ;])http:/);
  });
});

describe('parseImageHosts', () => {
  it('faz trim e ignora vazios', () => {
    expect(parseImageHosts(' a.com, ,b.com ')).toEqual(['a.com', 'b.com']);
    expect(parseImageHosts(undefined)).toEqual([]);
  });
});

describe('domínio Jitsi configurável', () => {
  it('usa o JITSI_DOMAIN em script-src e frame-src', () => {
    const csp = buildCsp({ ...base, jitsiDomain: 'jitsi.innova.ao' });
    expect(csp).toContain('https://jitsi.innova.ao');
    expect(csp).not.toContain('meet.jit.si');
  });

  it('rejeita valores inválidos e volta ao público', () => {
    expect(resolveJitsiDomain("x.com; script-src *")).toBe('meet.jit.si');
    expect(resolveJitsiDomain(undefined)).toBe('meet.jit.si');
  });
});
