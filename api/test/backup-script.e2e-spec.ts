import * as fs from 'fs';

import { CAMINHO_BACKUP } from './support/backup-harness';

describe('scripts/backup.sh do Podcast Editor', () => {
  it('existe, é bash e para na primeira falha', () => {
    expect(fs.existsSync(CAMINHO_BACKUP)).toBe(true);

    const fonte = fs.readFileSync(CAMINHO_BACKUP, 'utf8');

    expect(fonte.startsWith('#!/usr/bin/env bash')).toBe(true);
    expect(fonte).toMatch(/set -euo pipefail/);
    expect(fonte).toMatch(/mariadb-dump/);
  });
});
