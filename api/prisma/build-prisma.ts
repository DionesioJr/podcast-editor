import * as fs from 'fs';
import { globSync } from 'glob';

const BASE_SCHEMA = 'prisma/base.prisma';
const MODULES_PATTERN = 'src/modules/**/prisma/*.prisma';
const OUTPUT_SCHEMA = 'prisma/schema.prisma';

function buildSchema(): void {
  if (!fs.existsSync(BASE_SCHEMA)) {
    console.error(`Error: ${BASE_SCHEMA} not found`);
    process.exit(1);
  }

  let schema = fs.readFileSync(BASE_SCHEMA, 'utf8');

  const moduleSchemas = globSync(MODULES_PATTERN).sort();

  for (const file of moduleSchemas) {
    const content = fs.readFileSync(file, 'utf8').trim();
    if (content) {
      schema += '\n\n' + content;
    }
  }

  fs.writeFileSync(OUTPUT_SCHEMA, schema);
  console.log(`✓ Schema compiled: ${OUTPUT_SCHEMA}`);
}

buildSchema();
