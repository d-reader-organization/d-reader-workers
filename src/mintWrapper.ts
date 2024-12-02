import { fetchCandyGuard } from '@metaplex-foundation/mpl-core-candy-machine';
import { constructMultipleMintTransaction } from './mint';
import { CustomMetaplex } from './utils/metaplex';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchAddressLookupTable } from '@metaplex-foundation/mpl-toolbox';

export async function createMintTransaction(metaplex: CustomMetaplex) {
	const umi = metaplex.umi;
	// Change data as per your requirements
	const candyMachineAddress = publicKey('27oc77myssfnduDTJngFNrLSxpNXuyksUUPHSUKQEX5P');
	const collectionAddress = publicKey('Bn9rcVtXsXWdm57t7efWZV7NYHPUUcNZzUa8iK17nuio');
	const candyGuard = await fetchCandyGuard(umi, publicKey('8ZnQRSjvWnZU6dYa2p9RFGqFhtjon2nVFGtRRyZziorx'));
	const minter = publicKey('GfW7kxkxiFnPZ2mTtshYERFNqU1HRh5EodHdYTzaWbx7');
	const label = 'pu0-1';
	const numberOfItems = 3;
	const blockHash = await umi.rpc.getLatestBlockhash({ commitment: 'confirmed' });
	const lookupTableAddress = publicKey('BcosZmEdHkdJLJVpa6iUtqsiKjyJoSstG5i3cGx5iDHD');
	const lookupTable = await fetchAddressLookupTable(umi, lookupTableAddress);
	const transaction = await constructMultipleMintTransaction({
		candyMachineAddress,
		collectionAddress,
		candyGuard,
		minter,
		label,
		numberOfItems,
		blockHash,
		lookupTable,
		metaplex,
	});

	return transaction;
}
