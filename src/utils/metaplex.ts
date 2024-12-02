import * as AES from 'crypto-js/aes';
import * as Utf8 from 'crypto-js/enc-utf8';
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

enum Cluster{
	Devnet = 'devnet',
	Mainnet = 'mainnet-beta'
}

function clusterHeliusApiUrl(apiKey: string, cluster: Cluster = Cluster.Devnet) {
	switch (cluster) {
		case 'devnet':
			return `http://devnet.helius-rpc.com/?api-key=${apiKey}`;
		case 'mainnet-beta':
			return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
		default:
			return '';
	}
}

/**
 * Retrieves the authorization signer keypair from encrypted environment variables.
 */
const getAuthorizationSignerKeypair = () : Keypair => {
	const authorizationSigner = AES.decrypt(process.env.AUTHORIZATION_SIGNER_PRIVATE_KEY, process.env.AUTHORIZATION_SIGNER_SECRET);
	const authorizationKeypair = umi.eddsa.createKeypairFromSecretKey(Buffer.from(JSON.parse(authorizationSigner.toString(Utf8))));
	return authorizationKeypair;
};

/**
 * Returns the public key of the authorization signer.
 */
export const getAuthorizationSignerUmiPublicKey = () : PublicKey => {
	return getAuthorizationSignerKeypair().publicKey;
};

/**
 * Signs a UMI transaction with the authorization signer.
 * @param {UmiTransaction} transaction - The UMI transaction to sign.
 */
export const getAuthorizationSignerUmiSignature = async (transaction: UmiTransaction) : Promise<UmiTransaction> => {
	const authorizationKeypair = getAuthorizationSignerKeypair();
	const authorizationSigner = createSignerFromKeypair(umi, authorizationKeypair);
	return authorizationSigner.signTransaction(transaction);
};

/**
 * Signs a UMI transaction with the identity (treasury) signer.
 * @param {UmiTransaction} transaction - The UMI transaction to sign.
 */
export const getIdentityUmiSignature = async (transaction: UmiTransaction) : Promise<UmiTransaction> => {
	const treasuryKeypair = getTreasuryKeypair();
	const treasurySigner = createSignerFromKeypair(umi, treasuryKeypair);
	return treasurySigner.signTransaction(transaction);
};

/**
 * Retrieves the treasury keypair from encrypted environment variables.
 */
const getTreasuryKeypair = () : Keypair => {
	const treasuryWallet = AES.decrypt(process.env.TREASURY_PRIVATE_KEY, process.env.TREASURY_SECRET);
	const treasuryKeypair = umi.eddsa.createKeypairFromSecretKey(Buffer.from(JSON.parse(treasuryWallet.toString(Utf8))));
	return treasuryKeypair;
};

/**
 * Returns the public key of the treasury.
 * @returns {PublicKey} The public key of the treasury.
 */
export const getTreasuryPublicKey = () => {
	return getTreasuryKeypair().publicKey;
};

/**
 * Initializes and returns a UMI instance with the treasury keypair identity.
 * @param {string} [customEndpoint] - Optional custom endpoint URL.
 * @returns {Umi} The initialized UMI instance.
 */
export function initUmi(customEndpoint?: string) : Umi {
	const rpcEndpoint = customEndpoint || clusterHeliusApiUrl(process.env.HELIUS_API_KEY,Cluster[process.env.SOLANA_CLUSTER]);
	const treasuryKeypair = getTreasuryKeypair();
	const umi = createUmi(rpcEndpoint, { commitment: 'confirmed' })
		.use(mplCandyMachine())
		.use(umiKeypairIdentity(treasuryKeypair));

	return umi;
}

// Exports the initialized UMI instance
export const umi = initUmi();