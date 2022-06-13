import { createAssociatedTokenAccountInstruction, createInitializeMintInstruction, createMintToInstruction, createTransferCheckedInstruction, getAssociatedTokenAddress, getMint, MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { clusterApiUrl, Connection, Keypair, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_SLOT_HASHES_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js"
import { NextApiRequest, NextApiResponse } from "next"
import { usdcAddress } from "../../lib/addresses"
import calculatePrice from "../../lib/calculatePrice"
import { MintNftInstructionAccounts, MintNftInstructionArgs, createMintNftInstruction } from "@metaplex-foundation/mpl-candy-machine"
import base58 from "bs58"
// Constantsgst
// metaplex token metadata program address
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// associated token account program address
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

// candy machine program address
const CANDY_MACHINE_PROGRAM_ID = new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')

// You need to update the next 2 to your candy machine
// my candy machine address
const MY_CANDY_MACHINE_ID = new PublicKey("F8Kxjnp3dXyBamR4DKXSGvnzdz4PckJrQxWSingWfdQg")

// my wallet address used to create the candy machine
const CANDY_MACHINE_OWNER = new PublicKey("9AUvdLggr4DezH1FEHFBVqQPNUF9q6sZGTYoPMyum2sk")

export type MakeTransactionInputData = {
  account: string,
}

type MakeTransactionGetResponse = {
  label: string,
  icon: string,
}

export type MakeTransactionOutputData = {
  transaction: string,
  message: string,
}

type ErrorOutput = {
  error: string
}

function get(res: NextApiResponse<MakeTransactionGetResponse>) {
  res.status(200).json({
    label: "Cookies Inc",
    icon: "https://freesvg.org/img/1370962427.png",
  })
}

// Copied from candy-machine-ui: https://github.dev/metaplex-foundation/metaplex/blob/e20c14069be57ffa09428dd25a07a5bcf7ef51c4/js/packages/candy-machine-ui/src/candy-machine.ts#L222
const getMetadata = async (mint: PublicKey): Promise<PublicKey> => {
  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];
};

// Copied from candy-machine-ui: https://github.dev/metaplex-foundation/metaplex/blob/e20c14069be57ffa09428dd25a07a5bcf7ef51c4/js/packages/candy-machine-ui/src/candy-machine.ts#L206
const getMasterEdition = async (
  mint: PublicKey,
): Promise<PublicKey> => {
  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];
};

// Copied from candy-machine-ui: https://github.dev/metaplex-foundation/metaplex/blob/631983372cfbdfa99a45c26141f8756cd77efc99/js/packages/candy-machine-ui/src/utils.ts#L55-L63
const getAtaForMint = async (payer: PublicKey, mint: PublicKey,): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [payer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  );
};

// Copied from candy-machine-ui: https://github.dev/metaplex-foundation/metaplex/blob/e20c14069be57ffa09428dd25a07a5bcf7ef51c4/js/packages/candy-machine-ui/src/candy-machine.ts#L237-L238
const getCandyMachineCreator = async (candyMachine: PublicKey): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [Buffer.from('candy_machine'), candyMachine.toBuffer()],
    CANDY_MACHINE_PROGRAM_ID,
  );
};

const createSetupInstructions = async (
  connection: Connection,
  payer: PublicKey,
  mintFor: PublicKey,
  mint: PublicKey
): Promise<TransactionInstruction[]> => {
  const minimumBalance = await connection.getMinimumBalanceForRentExemption(MintLayout.span)
  const userTokenAccountAddress = (await getAtaForMint(mintFor, mint))[0];

  return [
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint,
      space: MintLayout.span,
      lamports: minimumBalance,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mint,
      0, // decimals
      mintFor, // mint authority
      mintFor, // freeze authority
    ),
    createAssociatedTokenAccountInstruction(
      payer, // payer
      userTokenAccountAddress, // user token address
      mintFor, // owner
      mint, // mint
    ),
    createMintToInstruction(
      mint, // mint
      userTokenAccountAddress, // destination
      mintFor, // authority
      1, // amount
    ),
  ]
}

const createMetaplexMintInstruction = async (
  payer: PublicKey,
  mintFor: PublicKey,
  mint: PublicKey
): Promise<TransactionInstruction> => {
  const metadata = await getMetadata(mint)
  const masterEdition = await getMasterEdition(mint)

  const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
    MY_CANDY_MACHINE_ID,
  );

  const accounts: MintNftInstructionAccounts = {
    // from metaplex CLI
    candyMachine: MY_CANDY_MACHINE_ID,
    // from getCandyMachineCreator
    candyMachineCreator: candyMachineCreator,
    // who is paying for the NFT to be minted
    payer: payer,
    // treasury, I just set this to myself (this is set in metaplex CLI)
    wallet: CANDY_MACHINE_OWNER,
    // metadata public key, from getMetadata call
    metadata,
    // mint public key, generated
    mint: mint,
    // mint + update authorities are who we're minting for
    mintAuthority: mintFor,
    updateAuthority: mintFor,
    // master edition public key, from getMasterEdition call
    masterEdition,
    // token metadata program is hardcoded
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    // clock, from web3.js
    clock: SYSVAR_CLOCK_PUBKEY,
    // copied from candy-machine-ui, which uses this
    recentBlockhashes: SYSVAR_SLOT_HASHES_PUBKEY,
    // also just copied candy-machine-ui
    instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
  }

  const args: MintNftInstructionArgs = {
    creatorBump
  }

  return createMintNftInstruction(accounts, args)
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>
) {
  try {
    // We pass the selected items in the query, calculate the expected cost
    const amount = calculatePrice(req.query)
    if (amount.toNumber() === 0) {
      res.status(400).json({ error: "Can't checkout with charge of 0" })
      return
    }

    // We pass the reference to use in the query
    const { reference } = req.query
    if (!reference) {
      res.status(400).json({ error: "No reference provided" })
      return
    }

    // We pass the buyer's public key in JSON body
    const { account } = req.body as MakeTransactionInputData
    if (!account) {
      res.status(40).json({ error: "No account provided" })
      return
    }

    // We get the shop private key from .env - this is the same as in our script
    const shopPrivateKey = process.env.SHOP_PRIVATE_KEY as string
    if (!shopPrivateKey) {
      res.status(500).json({ error: "Shop private key not available" })
    }
    const shopKeypair = Keypair.fromSecretKey(base58.decode(shopPrivateKey))


    const buyerPublicKey = new PublicKey(account)
    const shopPublicKey = shopKeypair.publicKey

    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)


    // Get details about the USDC token
    const usdcMint = await getMint(connection, usdcAddress)
    // Get the buyer's USDC token account address
    const buyerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey)
    // Get the shop's USDC token account address
    const shopUsdcAddress = await getAssociatedTokenAddress(usdcAddress, CANDY_MACHINE_OWNER)

    // Get a recent blockhash to include in the transaction
    const { blockhash } = await (connection.getLatestBlockhash('finalized'))

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      // The buyer pays the transaction fee
      feePayer: shopPublicKey,
    })

    const amountToPay = amount

    // Create the instruction to send USDC from the buyer to the shop
    const transferInstruction = createTransferCheckedInstruction(
      buyerUsdcAddress, // source
      usdcAddress, // mint (token address)
      shopUsdcAddress, // destination
      buyerPublicKey, // owner of source address
      amountToPay.toNumber() * (10 ** usdcMint.decimals), // amount to transfer (in units of the USDC token)
      usdcMint.decimals, // decimals of the USDC token
    )

    // Add the reference to the instruction as a key
    // This will mean this transaction is returned when we query for the reference
    transferInstruction.keys.push({
      pubkey: new PublicKey(reference),
      isSigner: false,
      isWritable: false,
    })

    const mint = Keypair.generate()

    // Create the mint setup instructions
    const mintSetupInstructions = await createSetupInstructions(connection, shopPublicKey, buyerPublicKey, mint.publicKey)

    // Create the mint NFT instruction
    const mintNFTInstruction = await createMetaplexMintInstruction(shopPublicKey, buyerPublicKey, mint.publicKey)

    // Add all instructions to the transaction
    transaction.add(transferInstruction, ...mintSetupInstructions, mintNFTInstruction)

    // Sign the transaction as the mint, which is required for setup instructions
    // Also sign as the shop, which is paying the NFT costs
    // We must partial sign because the transfer instruction still requires the user
    transaction.partialSign(mint, shopKeypair)

    // Serialize the transaction and convert to base64 to return it
    const serializedTransaction = transaction.serialize({
      // We will need the buyer to sign this transaction after it's returned to them
      requireAllSignatures: false
    })
    const base64 = serializedTransaction.toString('base64')

    // Insert into database: reference, amount

    const message = "Free dinosaur with all cookies! 🍪"

    // Return the serialized transaction
    res.status(200).json({
      transaction: base64,
      message,
    })
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: 'error creating transaction', })
    return
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MakeTransactionGetResponse | MakeTransactionOutputData | ErrorOutput>
) {
  if (req.method === "GET") {
    return get(res)
  } else if (req.method === "POST") {
    return await post(req, res)
  } else {
    return res.status(405).json({ error: "Method not allowed" })
  }
}