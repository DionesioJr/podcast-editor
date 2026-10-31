import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ErrorScreen } from './ErrorScreen';

interface CasoDeAcao {
  code: string;
  label: string;
  type: string;
}

const ACOES_POR_CODE: CasoDeAcao[] = [
  {
    code: 'INVALID_FILE_FORMAT',
    label: 'Escolher outro arquivo',
    type: 'choose_file',
  },
  { code: 'FILE_TOO_LARGE', label: 'Escolher outro arquivo', type: 'choose_file' },
  { code: 'VIDEO_TOO_LARGE', label: 'Escolher outro arquivo', type: 'choose_file' },
  { code: 'VIDEO_TOO_LONG', label: 'Escolher outro arquivo', type: 'choose_file' },
  {
    code: 'VIDEO_WITHOUT_AUDIO',
    label: 'Escolher outro arquivo',
    type: 'choose_file',
  },
  { code: 'NO_AUDIO', label: 'Escolher outro arquivo', type: 'choose_file' },
  { code: 'CORRUPTED_FILE', label: 'Escolher outro arquivo', type: 'choose_file' },
  { code: 'UPLOAD_CONNECTION_LOST', label: 'Aguardar', type: 'wait' },
  { code: 'UPLOAD_CONNECTION_LOST', label: 'Tentar novamente', type: 'retry' },
  {
    code: 'NO_SPEECH_DETECTED',
    label: 'Continuar com volume e formato',
    type: 'continue',
  },
  {
    code: 'LOW_QUALITY_TRANSCRIPTION',
    label: 'Continuar mesmo assim',
    type: 'continue',
  },
  { code: 'LOW_QUALITY_TRANSCRIPTION', label: 'Descartar', type: 'discard' },
  { code: 'TRANSCRIPTION_FAILED', label: 'Tentar novamente', type: 'retry' },
  {
    code: 'AI_UNAVAILABLE',
    label: 'Tentar novamente mais tarde',
    type: 'retry_later',
  },
  {
    code: 'AI_ANALYSIS_LIMIT_EXCEEDED',
    label: 'Continuar editando manualmente',
    type: 'continue_manually',
  },
  { code: 'AI_OUT_OF_SCOPE', label: 'Reescrever a instrução', type: 'rewrite' },
  { code: 'INVALID_TARGET_DURATION', label: 'Ajustar valor', type: 'adjust' },
  { code: 'VIDEO_TOO_SHORT', label: 'Voltar à revisão', type: 'go_to_review' },
  { code: 'NO_FORMAT_SELECTED', label: 'Marcar formato', type: 'select_format' },
  {
    code: 'EXPORT_LIMIT_EXCEEDED',
    label: 'Baixar os arquivos já exportados',
    type: 'download',
  },
  { code: 'EXPORT_FAILED', label: 'Tentar novamente', type: 'retry' },
  { code: 'NO_DISK_SPACE', label: 'Tentar mais tarde', type: 'retry_later' },
  {
    code: 'PROJECT_EXPIRED',
    label: 'Começar novo projeto',
    type: 'new_project',
  },
];

describe('ErrorScreen (PDE-101)', () => {
  it('mostra a mensagem traduzida do code recebido', () => {
    render(<ErrorScreen code="PROJECT_NOT_FOUND" />);

    expect(screen.getByText('Projeto não encontrado.')).toBeTruthy();
  });

  it('mostra o título padrão quando title não é informado', () => {
    render(<ErrorScreen code="PROJECT_NOT_FOUND" />);

    expect(screen.getByText('Algo deu errado')).toBeTruthy();
  });

  it('mostra o título informado quando recebido', () => {
    render(<ErrorScreen code="PROJECT_NOT_FOUND" title="Projeto indisponível" />);

    expect(screen.getByText('Projeto indisponível')).toBeTruthy();
  });

  it.each(ACOES_POR_CODE)(
    'oferece a ação "$label" do code $code',
    ({ code, label }) => {
      render(<ErrorScreen code={code} />);

      expect(screen.getByText(label)).toBeTruthy();
    },
  );

  it.each(ACOES_POR_CODE)(
    'dispara o tipo $type ao tocar em "$label" no code $code',
    ({ code, label, type }) => {
      const onAction = jest.fn();
      render(<ErrorScreen code={code} onAction={onAction} />);

      fireEvent.press(screen.getByText(label));

      expect(onAction).toHaveBeenCalledWith(type);
    },
  );

  it('renderiza as duas ações de UPLOAD_CONNECTION_LOST na tela', () => {
    render(<ErrorScreen code="UPLOAD_CONNECTION_LOST" />);

    expect(screen.getByText('Aguardar')).toBeTruthy();
    expect(screen.getByText('Tentar novamente')).toBeTruthy();
  });

  it('não chama onAction se nenhum botão for tocado', () => {
    const onAction = jest.fn();
    render(<ErrorScreen code="PROJECT_EXPIRED" onAction={onAction} />);

    expect(onAction).not.toHaveBeenCalled();
  });

  it('funciona sem onAction informado', () => {
    render(<ErrorScreen code="EXPORT_FAILED" />);

    expect(() => fireEvent.press(screen.getByText('Tentar novamente'))).not.toThrow();
  });

  it('mostra a mensagem genérica e nenhum botão para code desconhecido', () => {
    render(<ErrorScreen code="CODIGO_QUE_NAO_EXISTE" />);

    expect(screen.getByText('Erro desconhecido.')).toBeTruthy();
    expect(screen.queryByText('Tentar novamente')).toBeNull();
    expect(screen.queryByText('Escolher outro arquivo')).toBeNull();
  });
});
