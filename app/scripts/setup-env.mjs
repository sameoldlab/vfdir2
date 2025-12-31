import { existsSync } from 'node:fs';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { exportJwkKey, generatePrivateKey, importJwkKey } from '@atcute/oauth-node-client';

const ensureEnvLocal = async () => {
	const envPath = resolve(process.cwd(), '.env');
	const envLocalPath = resolve(process.cwd(), '.env.local');

	if (!existsSync(envLocalPath)) {
		await copyFile(envPath, envLocalPath);
	}

	return envLocalPath;
};

const upsertEnvVar = (input, key, value) => {
	const line = `${key}=${value}`;
	const re = new RegExp(`^${key}=.*$`, 'm');

	if (re.test(input)) {
		const match = input.match(re);
		const current = match ? match[0].slice(key.length + 1) : '';
		const trimmed = current.trim();

		if (trimmed === '' || trimmed === `''` || trimmed === `""`) {
			return input.replace(re, line);
		}

		return input;
	}

	const suffix = input.endsWith('\n') || input.length === 0 ? '' : '\n';
	return `${input}${suffix}${line}\n`;
};

const envLocalPath = await ensureEnvLocal();
const envLocal = await readFile(envLocalPath, 'utf8');

const privateKey = await generatePrivateKey('main', 'ES256');
const jwk = await exportJwkKey(privateKey);

// sanity-check that the key parses before writing
await importJwkKey(jwk);

const jwkJson = JSON.stringify(jwk);
const updated = upsertEnvVar(envLocal, 'PRIVATE_KEY_JWK', `'${jwkJson}'`);

if (updated !== envLocal) {
	await writeFile(envLocalPath, updated);
	console.log(`updated ${envLocalPath}`);
} else {
	console.log(`no changes to ${envLocalPath}`);
}
