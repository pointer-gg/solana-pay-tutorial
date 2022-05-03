import Products from '../../components/Products'
import SiteHeading from '../../components/SiteHeading'

export default function ShopPage() {
  return (
    <div className="flex flex-col items-stretch max-w-4xl gap-8 pt-24 m-auto">
      <SiteHeading>Cookies Inc</SiteHeading>
      <Products submitTarget='/shop/checkout' enabled={true} />    </div>
  )
}