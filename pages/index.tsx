import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import CouponBook from '../components/CouponBook'
import Products from '../components/Products'
import SiteHeading from '../components/SiteHeading'

export default function HomePage() {
  // We get the public key of the connected wallet, if there is one
  const { publicKey } = useWallet()

  return (
    <div className="m-auto flex max-w-4xl flex-col items-stretch gap-8 pt-24">
      <SiteHeading>Kara Cookies</SiteHeading>

      {/* We add the Solana wallet connect button */}
      <div className="basis-1/4">
        <WalletMultiButton className="!bg-gray-900 hover:scale-105" />
      </div>

      {/* We display the coupon book if there's a connected wallet */}
      {publicKey && <CouponBook />}

      {/* We disable checking out without a connected wallet */}
      {/* Also the submitTarget is /buy/transaction instead of /checkout */}
      <Products submitTarget="/checkout" enabled={publicKey !== null} />
    </div>
  )
}
