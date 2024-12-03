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
	const buffer = Buffer.from(bufferString, 'base64')
	const lookupTableSerialized = getAddressLookupTableAccountDataSerializer().deserialize(buffer)[0];
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
	const buffer = Buffer.from(bufferString, 'base64')
	return getCandyGuardAccountDataSerializer<GuardSetArgs, DefaultGuardSet>(umi).deserialize(buffer)[0];
}
