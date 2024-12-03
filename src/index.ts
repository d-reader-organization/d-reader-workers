/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { CustomMetaplex } from './utils/metaplex';
import { publicKey } from '@metaplex-foundation/umi';
import { constructMultipleMintTransaction } from './mint';
import { extractCandyGuardFromBuffer, getLookupTable } from './utils/utils';
import { apiHeaderKey, constructMintPath } from './constants';
import { constructMintTransactionSchema } from './utils/schema';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const apiKey = request.headers.get(apiHeaderKey);
		if (!apiKey || apiKey !== env.API_KEY) {
			return new Response(`Unauthorized`, { status: 401 });
		}
		const url = new URL(request.url);
		if (request.method === 'POST' && url.pathname === constructMintPath) {
			const json = await request.json();
			const { data: body, error } = constructMintTransactionSchema.safeParse(json);

			if (error) {
				const firstError = error.errors.at(0);
				return new Response(`${firstError?.path} is ${firstError?.message}`);
			}

			if (!body) {
				return new Response('Body is missing');
			}
			const metaplex = new CustomMetaplex(env);
			const lookupTable = getLookupTable({ address: body.lookupTableAddress, bufferString: body.lookupTableBufferString });
			const candyGuard = extractCandyGuardFromBuffer({ bufferString: body.candyGuardBufferString, umi: metaplex.umi });

			const transaction = await constructMultipleMintTransaction({
				candyGuard,
				candyMachineAddress: publicKey(body.candyMachineAddress),
				collectionAddress: publicKey(body.collectionAddress),
				label: body.label,
				metaplex,
				minter: publicKey(body.minter),
				numberOfItems: body.numberOfItems,
				lookupTable,
				isSponsored: body.isSponsored,
			});

			return new Response(JSON.stringify({ transaction }));
		}
		return new Response('ok');
	},
} satisfies ExportedHandler<Env>;
