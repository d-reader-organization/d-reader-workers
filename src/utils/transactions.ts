import { umi } from './metaplex';
import { Transaction as UmiTransaction } from '@metaplex-foundation/umi';
import { base58, base64 } from '@metaplex-foundation/umi/serializers';

export type SupportedEncoding = 'base58' | 'base64';

export const encodeUmiTransaction = (transaction: UmiTransaction, encoding: SupportedEncoding = 'base64') => {
	const bufferTx = umi.transactions.serialize(transaction);
	if (encoding === 'base58') {
		return base58.deserialize(bufferTx)[0];
	} else if (encoding === 'base64') {
		return base64.deserialize(bufferTx)[0];
	} else {
		throw new Error('Unsupported encoding format, base58 and base64 supported');
	}
};
