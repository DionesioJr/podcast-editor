import { colors, typography, radius, spacing, breakpoints, theme } from './theme';

describe('tokens de cor (PDE-7)', () => {
  it('reproduz as cores de marca do style.css', () => {
    expect(colors.primary).toBe('#4F2BE8');
    expect(colors.primaryHover).toBe('#3A1DB8');
    expect(colors.secondary).toBe('#6B6879');
    expect(colors.success).toBe('#1F9D6B');
    expect(colors.danger).toBe('#C0392B');
    expect(colors.warning).toBe('#B27A0B');
    expect(colors.info).toBe('#0EA5E9');
    expect(colors.accent).toBe('#E8388F');
    expect(colors.light).toBe('#F4F3F8');
    expect(colors.dark).toBe('#16141F');
    expect(colors.background).toBe('#F1F0F6');
    expect(colors.border).toBe('#E4E2EC');
  });

  it('reproduz as variações de texto do style.css', () => {
    expect(colors.text.primary).toBe('#16141F');
    expect(colors.text.secondary).toBe('#6B6879');
    expect(colors.text.tertiary).toBe('#8B8898');
  });
});

describe('tokens de tipografia (PDE-7)', () => {
  it('reproduz as famílias de fonte do style.css', () => {
    expect(typography.fontFamily.base).toBe('Plus Jakarta Sans');
    expect(typography.fontFamily.display).toBe('Bricolage Grotesque');
  });

  it('converte a escala de tamanho de fonte de rem para px', () => {
    expect(typography.fontSize.xs).toBe(13);
    expect(typography.fontSize.sm).toBe(14);
    expect(typography.fontSize.base).toBe(15);
    expect(typography.fontSize.md).toBe(16);
    expect(typography.fontSize.lg).toBe(18);
    expect(typography.fontSize.xl).toBe(21);
    expect(typography.fontSize['2xl']).toBe(24);
    expect(typography.fontSize['3xl']).toBe(28);
    expect(typography.fontSize['4xl']).toBe(34);
    expect(typography.fontSize['5xl']).toBe(44);
  });

  it('reproduz a altura de linha do style.css', () => {
    expect(typography.lineHeight).toBe(1.5);
  });
});

describe('tokens de raio (PDE-7)', () => {
  it('converte a escala de raio de rem para px', () => {
    expect(radius.sm).toBe(8);
    expect(radius.base).toBe(12);
    expect(radius.lg).toBe(16);
    expect(radius.xl).toBe(20);
    expect(radius.xxl).toBe(24);
    expect(radius.pill).toBe(999);
  });
});

describe('tokens de espaçamento (PDE-7)', () => {
  it('converte a escala de espaçamento de rem para px', () => {
    expect(spacing[1]).toBe(4);
    expect(spacing[2]).toBe(8);
    expect(spacing[3]).toBe(12);
    expect(spacing[4]).toBe(16);
    expect(spacing[5]).toBe(20);
    expect(spacing[6]).toBe(24);
    expect(spacing[7]).toBe(32);
    expect(spacing[8]).toBe(40);
  });
});

describe('tokens de breakpoint (PDE-7)', () => {
  it('reproduz os valores documentais do style.css (mobile até 560px, tablet até 840px)', () => {
    expect(breakpoints.mobile).toBe(560);
    expect(breakpoints.tablet).toBe(840);
  });
});

describe('objeto theme consolidado (PDE-7)', () => {
  it('reúne todos os grupos de token sem duplicar valores', () => {
    expect(theme.colors).toBe(colors);
    expect(theme.typography).toBe(typography);
    expect(theme.radius).toBe(radius);
    expect(theme.spacing).toBe(spacing);
    expect(theme.breakpoints).toBe(breakpoints);
  });
});
