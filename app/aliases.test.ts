import { theme } from '@src/constants/theme';
import { api } from '@/src/config/api';

describe('Resolução real dos aliases em tempo de execução (PDE-6)', () => {
  it('resolve @src/* importando um módulo de verdade dentro de src', () => {
    expect(theme.colors.primary).toBe('#4F2BE8');
  });

  it('resolve @/* importando um módulo de verdade a partir da raiz do app', () => {
    expect(api.baseURL).toBe('http://localhost:3000');
  });
});
