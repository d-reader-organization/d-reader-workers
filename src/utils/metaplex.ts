import { Metaplex, keypairIdentity, MetaplexFile } from '@metaplex-foundation/js';
import { Cluster, Connection, Keypair, Transaction } from '@solana/web3.js';
import * as AES from 'crypto-js/aes';
import * as Utf8 from 'crypto-js/enc-utf8';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import {
	createSignerFromKeypair,
	publicKey,           
	keypairIdentity as umiKeypairIdentity,
	Transaction as UmiTransaction,
} from '@metaplex-foundation/umi';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { mplCandyMachine } from '@metaplex-foundation/mpl-core-candy-machine';

export type MetadataFile = {
	type?: string;
	uri?: MetaplexFile | string;
	[key: string]: unknown;
};

function clusterHeliusApiUrl(apiKey: string, cluster: Cluster = 'devnet') {
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
 * Retrieves the third-party signer keypair from encrypted environment variables.
 * @returns {Keypair} The third-party signer keypair.
 */
const getThirdPartySignerKeypair = () => {
	// TODO: add env
	const thirdPartySigner = AES.decrypt(`${process.env.THIRD_PARTY_SIGNER_PRIVATE_KEY}`, `${process.env.THIRD_PARTY_SIGNER_SECRET}`);
	const thirdPartySignerKeypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(thirdPartySigner.toString(Utf8))));
	return thirdPartySignerKeypair;
};

/**
 * Returns the public key of the third-party signer.
 * @returns {PublicKey} The public key of the third-party signer.
 */
export const getThirdPartySigner = () => {
	return getThirdPartySignerKeypair().publicKey;
};

/**
 * Returns the public key of the third-party signer.
 * @returns {PublicKey} The public key of the third-party signer.
 */
export const getThirdPartyUmiSigner = () => {
	return publicKey(getThirdPartySignerKeypair().publicKey);
};

/**
 * Signs a UMI transaction with the authorization signer.
 * @param {UmiTransaction} transaction - The UMI transaction to sign.
 * @returns {Promise<UmiTransaction>} The signed UMI transaction.
 */
export const getThirdPartyUmiSignature = async (transaction: UmiTransaction) => {
	const thirdPartyKeypair = fromWeb3JsKeypair(getThirdPartySignerKeypair());
	const thirdPartySigner = createSignerFromKeypair(umi, thirdPartyKeypair);
	return thirdPartySigner.signTransaction(transaction);
};

/**
 * Retrieves the authorization signer keypair from encrypted environment variables.
 * @returns {Keypair} The authorization signer keypair.
 */
const getAuthorizationSignerKeypair = () => {
	// TODO: add env
	const authorizationSigner = AES.decrypt(process.env.AUTHORIZATION_SIGNER_PRIVATE_KEY, process.env.AUTHORIZATION_SIGNER_SECRET);
	const authorizationKeypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(authorizationSigner.toString(Utf8))));
	return authorizationKeypair;
};

/**
 * Returns the public key of the authorization signer.
 * @returns {PublicKey} The public key of the authorization signer.
 */
export const getAuthorizationSigner = () => {
	return getAuthorizationSignerKeypair().publicKey;
};

/**
 * Returns the public key of the authorization signer.
 * @returns {PublicKey} The public key of the authorization signer.
 */
export const getAuthorizationSignerUmiPublicKey = () => {
	return publicKey(getAuthorizationSignerKeypair().publicKey);
};

/**
 * Signs a UMI transaction with the authorization signer.
 * @param {UmiTransaction} transaction - The UMI transaction to sign.
 * @returns {Promise<UmiTransaction>} The signed UMI transaction.
 */
export const getAuthorizationSignerUmiSignature = async (transaction: UmiTransaction) => {
	const authorizationKeypair = fromWeb3JsKeypair(getAuthorizationSignerKeypair());
	const authorizationSigner = createSignerFromKeypair(umi, authorizationKeypair);
	return authorizationSigner.signTransaction(transaction);
};

/**
 * Signs a UMI transaction with the identity (treasury) signer.
 * @param {UmiTransaction} transaction - The UMI transaction to sign.
 * @returns {UmiTransaction} The signed UMI transaction.
 */
export const getIdentityUmiSignature = async (transaction: UmiTransaction) => {
	const treasuryKeypair = fromWeb3JsKeypair(getTreasuryKeypair());
	const treasurySigner = createSignerFromKeypair(umi, treasuryKeypair);
	return treasurySigner.signTransaction(transaction);
};

/**
 * Retrieves the treasury keypair from encrypted environment variables.
 * @returns {Keypair} The treasury keypair.
 */
const getTreasuryKeypair = () => {
	const treasuryWallet = AES.decrypt(process.env.TREASURY_PRIVATE_KEY, process.env.TREASURY_SECRET);
	const treasuryKeypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(treasuryWallet.toString(Utf8))));
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
 * Signs a legacy transaction with the identity (treasury) signer.
 * @param {Transaction} transaction - The transaction to sign.
 * @returns {Transaction} The signed transaction.
 */
export const getIdentitySignature = (transaction: Transaction) => {
	const signer = getTreasuryKeypair();
	transaction.partialSign(signer);
	return transaction;
};

/**
 * Creates and returns a Solana connection based on the provided or default endpoint.
 * @param {string} [customEndpoint] - Optional custom endpoint URL.
 * @returns {Connection} The Solana connection.
 */
export function getConnection(customEndpoint?: string) {
	const endpoint = customEndpoint || clusterHeliusApiUrl(process.env.HELIUS_API_KEY ?? '', process.env.SOLANA_CLUSTER as Cluster);
	const connection = new Connection(endpoint, 'confirmed');
	return connection;
}

/**
 * Initializes and returns a Metaplex instance with the treasury keypair identity.
 * @param {string} [customEndpoint] - Optional custom endpoint URL.
 * @returns {Metaplex} The initialized Metaplex instance.
 */
export function initMetaplex(customEndpoint?: string) {
	const connection = getConnection(customEndpoint);
	const treasuryKeypair = getTreasuryKeypair();
	const metaplex = new Metaplex(connection).use(keypairIdentity(treasuryKeypair));

	return metaplex;
}

// Exports the initialized Metaplex instance
export const metaplex = initMetaplex();

/**
 * Initializes and returns a UMI instance with the treasury keypair identity.
 * @param {string} [customEndpoint] - Optional custom endpoint URL.
 * @returns {Umi} The initialized UMI instance.
 */
export function initUmi(customEndpoint?: string) {
	const connection = getConnection(customEndpoint);
	const treasuryKeypair = getTreasuryKeypair();
	const umi = createUmi(connection.rpcEndpoint, { commitment: 'confirmed' })
		.use(mplCore())
		.use(mplCandyMachine())
		.use(umiKeypairIdentity(fromWeb3JsKeypair(treasuryKeypair)));

	return umi;
}

// Exports the initialized UMI instance
export const umi = initUmi();

/**
 * Converts MetaplexFile objects to MetadataFile objects.
 * @param {...MetaplexFile} files - The MetaplexFile objects to convert.
 * @returns {MetadataFile[]} An array of converted MetadataFile objects.
 */
export function writeFiles(...files: MetaplexFile[]): MetadataFile[] {
	return files.map((file) => ({
		uri: file,
		type: file.contentType,
	}));
}
