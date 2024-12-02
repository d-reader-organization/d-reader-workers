import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
	createSignerFromKeypair,
	Keypair,
	PublicKey,
	Umi,
	keypairIdentity as umiKeypairIdentity,
	Transaction as UmiTransaction,
} from '@metaplex-foundation/umi';
import { mplCandyMachine } from '@metaplex-foundation/mpl-core-candy-machine';
import * as AES from 'crypto-js/aes';
import * as Utf8 from 'crypto-js/enc-utf8';

enum Cluster {
	Devnet = 'devnet',
	Mainnet = 'mainnet-beta',
}

export class CustomMetaplex {
	private readonly env: Env;
	public readonly umi: Umi;

	constructor(env: Env) {
		this.env = env;
		this.umi = this.initUmi(env);
		this.umi.use(mplCandyMachine()).use(umiKeypairIdentity(this.getTreasuryKeypair()));
	}

	/**
	 * Initializes and returns a UMI instance with the treasury keypair identity.
	 * @param {string} [customEndpoint] - Optional custom endpoint URL.
	 * @returns {Umi} The initialized UMI instance.
	 */
	initUmi(env: Env): Umi {
		const rpcEndpoint = clusterHeliusApiUrl({
			apiKey: env.HELIUS_API_KEY ?? '',
			cluster: env.SOLANA_CLUSTER ? (env.SOLANA_CLUSTER as Cluster) : undefined,
		});
		return createUmi(rpcEndpoint, { commitment: 'confirmed' });
	}

	/**
	 * Retrieves the authorization signer keypair from encrypted environment variables.
	 */
	getAuthorizationSignerKeypair(): Keypair {
		const authorizationSigner = AES.decrypt(this.env.AUTHORIZATION_SIGNER_PRIVATE_KEY,this.env.AUTHORIZATION_SIGNER_SECRET);
		const authorizationKeypair = this.umi.eddsa.createKeypairFromSecretKey(Buffer.from(JSON.parse(authorizationSigner.toString(Utf8))));

		return authorizationKeypair;
	}

	/**
	 * Returns the public key of the authorization signer.
	 */
	getAuthorizationSignerUmiPublicKey(): PublicKey {
		return this.getAuthorizationSignerKeypair().publicKey;
	}

	/**
	 * Signs a UMI transaction with the authorization signer.
	 * @param {UmiTransaction} transaction - The UMI transaction to sign.
	 */
	async getAuthorizationSignerUmiSignature(transaction: UmiTransaction): Promise<UmiTransaction> {
		const authorizationKeypair = this.getAuthorizationSignerKeypair();
		const authorizationSigner = createSignerFromKeypair(this.umi, authorizationKeypair);
		return authorizationSigner.signTransaction(transaction);
	}

	/**
	 * Signs a UMI transaction with the identity (treasury) signer.
	 * @param {UmiTransaction} transaction - The UMI transaction to sign.
	 */
	async getIdentityUmiSignature(transaction: UmiTransaction): Promise<UmiTransaction> {
		const treasuryKeypair = this.getTreasuryKeypair();
		const treasurySigner = createSignerFromKeypair(this.umi, treasuryKeypair);
		return treasurySigner.signTransaction(transaction);
	}

	/**
	 * Retrieves the treasury keypair from encrypted environment variables.
	 */
	getTreasuryKeypair(): Keypair {
		const treasurySigner = AES.decrypt(this.env.TREASURY_PRIVATE_KEY,this.env.TREASURY_SECRET);
		const treasuryKeypair = this.umi.eddsa.createKeypairFromSecretKey(Buffer.from(JSON.parse(treasurySigner.toString(Utf8))));
		return treasuryKeypair;
	}

	/**
	 * Returns the public key of the treasury.
	 * @returns {PublicKey} The public key of the treasury.
	 */
	getTreasuryPublicKey() {
		return this.getTreasuryKeypair().publicKey;
	}
}

function clusterHeliusApiUrl({ apiKey, cluster }: { apiKey: string; cluster?: Cluster }) {
	switch (cluster) {
		case 'devnet':
			return `http://devnet.helius-rpc.com/?api-key=${apiKey}`;
		case 'mainnet-beta':
			return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
		default:
			return '';
	}
}
