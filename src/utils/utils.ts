import {
	CandyGuardAccountData,
	DefaultGuardSet,
	getCandyGuardAccountDataSerializer,
	GuardSetArgs,
} from '@metaplex-foundation/mpl-core-candy-machine';
import { getAddressLookupTableAccountDataSerializer } from '@metaplex-foundation/mpl-toolbox';
import { AddressLookupTableInput, publicKey, Umi } from '@metaplex-foundation/umi';

export function getLookupTable({
	address,
	bufferString,
}: {
	address?: string;
	bufferString?: string;
}): AddressLookupTableInput | undefined {
	if (!address || !bufferString) {
		return;
	}

	const lookupTableAddress = publicKey(address);
	const lookupTableSerialized = getAddressLookupTableAccountDataSerializer().deserialize(
		// TODO figure out better way
		Uint8Array.from(bufferString.split(',').map((item) => +item))
	)[0];
	return {
		addresses: lookupTableSerialized.addresses,
		publicKey: publicKey(lookupTableAddress),
	};
}

export function extractCandyGuardFromBuffer({
	bufferString,
	umi,
}: {
	bufferString: string;
	umi: Umi;
}): CandyGuardAccountData<DefaultGuardSet> {
	// TODO figure out better way
	const candyGuardBuffer = Uint8Array.from(bufferString.split(',').map((item) => +item));
	return getCandyGuardAccountDataSerializer<GuardSetArgs, DefaultGuardSet>(umi).deserialize(candyGuardBuffer)[0];
}
