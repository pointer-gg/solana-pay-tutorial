import { createAssociatedTokenAccount, createMint, getAccount, mintToChecked } from '@solana/spl-token'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl, Connection, Keypair } from '@solana/web3.js'
import base58 from 'bs58'

// Read .env into process.env
import 'dotenv/config'

// Initialise Solana connection
const network = WalletAdapterNetwork.Devnet
const endpoint = clusterApiUrl(network)
const connection = new Connection(endpoint)

// Initialise shop account
const shopPrivateKey = process.env.SHOP_PRIVATE_KEY
if (!shopPrivateKey) {
  throw new Error('SHOP_PRIVATE_KEY not set')
}
const shopAccount = Keypair.fromSecretKey(base58.decode(shopPrivateKey))

// Create the token, returns the token public key
console.log("Creating token...")
const myCouponAddress = await createMint(
  connection,
  shopAccount, // payer
  shopAccount.publicKey, // who has permission to mint?
  shopAccount.publicKey, // who has permission to freeze?
  0 // decimals (0 = whole numbers)
)
console.log("Token created:", myCouponAddress.toString())

// Create the associated token account for the shop
console.log("Creating token account for the shop...")
const shopCouponAddress = await createAssociatedTokenAccount(
  connection,
  shopAccount, // payer
  myCouponAddress, // token
  shopAccount.publicKey, // who to create an account for
)
console.log("Token account created:", shopCouponAddress.toString())

// Mint 1 million coupons to the shop account
console.log("Minting 1 million coupons to the shop account...")
await mintToChecked(
  connection,
  shopAccount, // payer
  myCouponAddress, // token
  shopCouponAddress, // recipient
  shopAccount, // authority to mint
  1_000_000, // amount
  0, //decimals
)
console.log("Minted 1 million coupons to the shop account")

const { amount } = await getAccount(connection, shopCouponAddress)
console.log({
  myCouponAddress: myCouponAddress.toString(),
  balance: amount.toLocaleString(),
})