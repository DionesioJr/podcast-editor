import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from './ProgressBar';

function obterLarguraDoPreenchimento(toJSON: () => any) {
  const arvore = toJSON();
  const preenchimento = arvore.children[0];
  const estilo = Array.isArray(preenchimento.props.style)
    ? Object.assign({}, ...preenchimento.props.style)
    : preenchimento.props.style;

  return estilo.width;
}

describe('ProgressBar', () => {
  it('reflete o progresso recebido na largura do preenchimento', () => {
    const { toJSON } = render(<ProgressBar progress={42} />);

    expect(obterLarguraDoPreenchimento(toJSON)).toBe('42%');
  });

  it('limita o progresso a 100% quando o valor recebido é maior', () => {
    const { toJSON } = render(<ProgressBar progress={150} />);

    expect(obterLarguraDoPreenchimento(toJSON)).toBe('100%');
  });

  it('limita o progresso a 0% quando o valor recebido é negativo', () => {
    const { toJSON } = render(<ProgressBar progress={-20} />);

    expect(obterLarguraDoPreenchimento(toJSON)).toBe('0%');
  });

  it('renderiza progresso zero sem lançar erro', () => {
    const { toJSON } = render(<ProgressBar progress={0} />);

    expect(obterLarguraDoPreenchimento(toJSON)).toBe('0%');
  });
});
