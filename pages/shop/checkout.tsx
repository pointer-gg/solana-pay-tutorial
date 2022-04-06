// pages/shop/checkout.tsx
import { createQR, encodeURL, EncodeURLComponents, findTransactionSignature, FindTransactionSignatureError, validateTransactionSignature, ValidateTransactionSignatureError } from "@solana/pay";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { time } from "console";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef } from "react";
import BackLink from "../../components/BackLink";
import PageHeading from "../../components/PageHeading";
import { shopAddress, usdcAddress } from "../../lib/addresses";
import calculatePrice from "../../lib/calculatePrice";

export default function Checkout() {
  const router = useRouter()

  // ref to a div where we'll show the QR code
  const qrRef = useRef<HTMLDivElement>(null)

  const amount = useMemo(() => calculatePrice(router.query), [router.query])

  // Unique address that we can listen for payments to
  const reference = useMemo(() => Keypair.generate().publicKey, [])

  // Get a connection to Solana devnet
  const network = WalletAdapterNetwork.Devnet
  const endpoint = clusterApiUrl(network)
  const connection = new Connection(endpoint)


  // Solana Pay transfer params
  const urlParams: EncodeURLComponents = {
    recipient: shopAddress,
    splToken: usdcAddress,
    amount,
    reference,
    label: "Cookies Inc",
    message: "Thanks for your order! 🍪",
  }

  // Encode the params into the format shown
  const url = encodeURL(urlParams)
  console.log({ url })

  // Show the QR code
  useEffect(() => {
    const qr = createQR(url, 512, 'transparent')
    if (qrRef.current && amount.isGreaterThan(0)) {
      qrRef.current.innerHTML = ''
      qr.append(qrRef.current)
    }
  })

  // Check every 0.5s if the transaction is completed
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Check if there is any transaction for the reference
        const signatureInfo = await findTransactionSignature(connection, reference, {}, 'confirmed')
        // Validate that the transaction has the expected recipient, amount and SPL token
        await validateTransactionSignature(connection, signatureInfo.signature, shopAddress, amount, usdcAddress, reference, 'confirmed')
        router.push('/shop/confirmed')
      } catch (e) {
        if (e instanceof FindTransactionSignatureError) {
          // No transaction found yet, ignore this error
          return;
        }
        if (e instanceof ValidateTransactionSignatureError) {
          // Transaction is invalid
          console.error('Transaction is invalid', e)
          return;
        }
        console.error('Unknown error', e)
      }
    }, 500)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex flex-col gap-8 items-center">
      <BackLink href='/shop'>Cancel</BackLink>

      <PageHeading>Checkout ${amount.toString()}</PageHeading>

      {/* div added to display the QR code */}
      <div ref={qrRef} />
    </div>
  )
}