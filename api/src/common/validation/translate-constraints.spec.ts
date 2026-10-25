import { translateConstraints } from './translate-constraints';

describe('translateConstraints', () => {
  it('traduz constraint isString para português', () => {
    const constraints = { isString: 'must be a string' };
    const result = translateConstraints(constraints);

    expect(result).toContain('deve ser uma string');
  });

  it('traduz constraint isNumber para português', () => {
    const constraints = { isNumber: 'must be a number' };
    const result = translateConstraints(constraints);

    expect(result).toContain('deve ser um número');
  });

  it('traduz constraint isEnum para português', () => {
    const constraints = { isEnum: 'must be a valid enum value' };
    const result = translateConstraints(constraints);

    expect(result).toContain('deve ser um dos valores permitidos');
  });

  it('traduz constraint isInt para português', () => {
    const constraints = { isInt: 'must be an integer number' };
    const result = translateConstraints(constraints);

    expect(result).toContain('deve ser um número inteiro');
  });

  it('traduz constraint min para português', () => {
    const constraints = { min: 'must be not less than 1' };
    const result = translateConstraints(constraints);

    expect(result).toContain('deve ser maior ou igual a');
  });

  it('retorna mensagem original quando constraint não é reconhecido', () => {
    const constraints = { unknownConstraint: 'mensagem desconhecida' };
    const result = translateConstraints(constraints);

    expect(result).toContain('mensagem desconhecida');
  });

  it('traduz múltiplas constraints', () => {
    const constraints = {
      isString: 'must be a string',
      isNotEmpty: 'should not be empty',
    };
    const result = translateConstraints(constraints);

    expect(result.length).toBe(2);
  });
});
