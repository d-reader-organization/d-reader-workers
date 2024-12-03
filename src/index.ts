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

type RequestBody = {
	candyMachineAddress: string;
	collectionAddress: string;
	candyGuardBufferString: string;
	lookupTableAddress?: string;
	lookupTableBufferString?: string;
	minter: string;
	label: string;
	numberOfItems: number;
	isSponsored?: boolean;
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const json = (await request.json()) as RequestBody;

		const metaplex = new CustomMetaplex(env);
		const lookupTable = getLookupTable({ address: json.lookupTableAddress, bufferString: json.lookupTableBufferString });
		const candyGuard = extractCandyGuardFromBuffer({ bufferString: json.candyGuardBufferString, umi: metaplex.umi });

		const transaction = await constructMultipleMintTransaction({
			candyGuard,
			candyMachineAddress: publicKey(json.candyMachineAddress),
			collectionAddress: publicKey(json.collectionAddress),
			label: json.label,
			metaplex,
			minter: publicKey(json.minter),
			numberOfItems: json.numberOfItems,
			lookupTable,
			isSponsored: json.isSponsored,
		});

		return new Response(JSON.stringify({ transaction }));
	},
} satisfies ExportedHandler<Env>;
