import Products from '../../components/Products'
import SiteHeading from '../../components/SiteHeading'

export default function ShopPage() {
  return (
    <div className="m-auto flex max-w-4xl flex-col items-stretch gap-8 pt-24">
      <SiteHeading>Kara Cookies</SiteHeading>
      <Products submitTarget="/shop/checkout" enabled={true} />{' '}
    </div>
  )
}
