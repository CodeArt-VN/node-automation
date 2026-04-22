import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = join(root, 'nodes/ArtErp/arterp.svg');

for (const dir of ['dist/nodes/ArtErp', 'dist/credentials']) {
	mkdirSync(join(root, dir), { recursive: true });
}

copyFileSync(svg, join(root, 'dist/nodes/ArtErp/arterp.svg'));
copyFileSync(svg, join(root, 'dist/credentials/arterp.svg'));
