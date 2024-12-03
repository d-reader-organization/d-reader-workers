import { z } from 'zod';

export const constructMintTransactionSchema = z.object({
  candyMachineAddress: z.string(),
  collectionAddress: z.string(),
  candyGuardBufferString: z.string(),
  lookupTableAddress: z.string().optional(),
  lookupTableBufferString: z.string().optional(),
  minter: z.string(),
  label: z.string(),
  numberOfItems: z.number().int().positive(),
  isSponsored: z.boolean().optional(),
});
