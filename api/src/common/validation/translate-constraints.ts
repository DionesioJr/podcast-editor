const constraintsMap: Record<string, string> = {
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

export function translateConstraints(constraints: Record<string, string>): string[] {
  return Object.entries(constraints).map(([key, message]) => {
    const baseKey = Object.keys(constraintsMap).find((k) => key.toLowerCase() === k);

    if (baseKey && constraintsMap[baseKey]) {
      return constraintsMap[baseKey];
    }

    return message;
  });
}
