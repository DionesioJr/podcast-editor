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

  it('traduz constraint minLength para português, sem confundir com min', () => {
    const constraints = { minLength: 'must be longer than or equal to 3 characters' };
    const result = translateConstraints(constraints);

    expect(result).toContain('deve ter no mínimo');
  });

  it('traduz constraint maxLength para português, sem confundir com max', () => {
    const constraints = { maxLength: 'must be shorter than or equal to 10 characters' };
    const result = translateConstraints(constraints);

    expect(result).toContain('deve ter no máximo');
  });

  it('traduz todas as chaves conhecidas do dicionário', () => {
    const expected: Record<string, string> = {
      isString: 'deve ser uma string',
      isNumber: 'deve ser um número',
      isEnum: 'deve ser um dos valores permitidos',
      isOptional: 'é opcional',
      isNotEmpty: 'não pode estar vazio',
      isDefined: 'deve ser definido',
      isEmail: 'deve ser um e-mail válido',
      isUrl: 'deve ser uma URL válida',
      isDate: 'deve ser uma data válida',
      isBoolean: 'deve ser booleano (true ou false)',
      isArray: 'deve ser um array',
      isInt: 'deve ser um número inteiro',
      min: 'deve ser maior ou igual a',
      max: 'deve ser menor ou igual a',
      minLength: 'deve ter no mínimo',
      maxLength: 'deve ter no máximo',
      matches: 'deve estar no formato esperado',
      contains: 'deve conter',
      isPositive: 'deve ser um número positivo',
      isNegative: 'deve ser um número negativo',
    };

    Object.entries(expected).forEach(([key, message]) => {
      expect(translateConstraints({ [key]: 'mensagem original' })).toEqual([message]);
    });
  });

  it('retorna lista vazia quando não há constraints', () => {
    expect(translateConstraints({})).toEqual([]);
  });

  it('reconhece a chave independente da caixa, sem alterar a mensagem traduzida', () => {
    expect(translateConstraints({ IsString: 'must be a string' })).toEqual([
      'deve ser uma string',
    ]);
    expect(translateConstraints({ MIN: 'must be not less than 1' })).toEqual([
      'deve ser maior ou igual a',
    ]);
  });

  it('não confunde min com minLength quando as duas aparecem juntas', () => {
    const result = translateConstraints({
      min: 'mensagem de min',
      minLength: 'mensagem de minLength',
    });

    expect(result).toEqual(['deve ser maior ou igual a', 'deve ter no mínimo']);
  });

  it('não confunde max com maxLength quando as duas aparecem juntas', () => {
    const result = translateConstraints({
      max: 'mensagem de max',
      maxLength: 'mensagem de maxLength',
    });

    expect(result).toEqual(['deve ser menor ou igual a', 'deve ter no máximo']);
  });

  it('preserva a mensagem original de constraint desconhecido', () => {
    expect(translateConstraints({ regraDesconhecida: 'mensagem crua' })).toEqual([
      'mensagem crua',
    ]);
  });

  it('traduz as conhecidas e preserva as desconhecidas na mesma ordem', () => {
    const result = translateConstraints({
      isString: 'must be a string',
      regraDesconhecida: 'mensagem crua',
      minLength: 'too short',
    });

    expect(result).toEqual(['deve ser uma string', 'mensagem crua', 'deve ter no mínimo']);
  });

  it('mantém a quantidade de mensagens igual à quantidade de constraints', () => {
    const result = translateConstraints({ isString: 'a', foo: 'b', bar: 'c' });

    expect(result).toHaveLength(3);
  });
});
