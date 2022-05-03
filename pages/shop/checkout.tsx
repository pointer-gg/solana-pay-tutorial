import { createQR, encodeURL, TransferRequestURLFields, findReference, validateTransfer, FindReferenceError, ValidateTransferError, TransactionRequestURLFields } from "@solana/pay";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
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

  // Read the URL query (which includes our chosen products)
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(router.query)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) {
          searchParams.append(key, v);
        }
      } else {
        searchParams.append(key, value);
      }
    }
  }

  // Generate the unique reference which will be used for this transaction
  const reference = useMemo(() => Keypair.generate().publicKey, []);

  // Add it to the params we'll pass to the API
  searchParams.append('reference', reference.toString());

  // Get a connection to Solana devnet
  const network = WalletAdapterNetwork.Devnet
  const endpoint = clusterApiUrl(network)
  const connection = new Connection(endpoint)

  // Solana Pay transfer params
  const urlParams: TransferRequestURLFields = {
    recipient: shopAddress,
    splToken: usdcAddress,
    amount,
    reference,
    label: "Cookies Inc",
    message: "Thanks for your order! 🍪",
  }

  // Show the QR code
  useEffect(() => {
    // window.location is only available in the browser, so create the URL in here
    const { location } = window
    const apiUrl = `${location.protocol}//${location.host}/api/makeTransaction?${searchParams.toString()}`
    const urlParams: TransactionRequestURLFields = {
      link: new URL(apiUrl),
      label: "Cookies Inc",
      message: "Thanks for your order! 🍪",
    }
    const solanaUrl = encodeURL(urlParams)
    const qr = createQR(solanaUrl, 512, 'transparent')
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
        const signatureInfo = await findReference(connection, reference, { finality: 'confirmed' })
        // Validate that the transaction has the expected recipient, amount and SPL token
        await validateTransfer(
          connection,
          signatureInfo.signature,
          {
            recipient: shopAddress,
            amount,
            splToken: usdcAddress,
            reference,
          },
          { commitment: 'confirmed' }
        )
        router.push('/shop/confirmed')
      } catch (e) {
        if (e instanceof FindReferenceError) {
          // No transaction found yet, ignore this error
          return;
        }
        if (e instanceof ValidateTransferError) {
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
  }, [amount])

  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href='/shop'>Cancel</BackLink>

      <PageHeading>Checkout ${amount.toString()}</PageHeading>

      {/* div added to display the QR code */}
      <div ref={qrRef} />
    </div>
  )
}