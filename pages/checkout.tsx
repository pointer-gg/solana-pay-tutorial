import { useRouter } from "next/router";
import BackLink from "../components/BackLink";
import PageHeading from "../components/PageHeading";
import calculatePrice from "../lib/calculatePrice";

export default function Checkout() {
  const router = useRouter()

  const amount = calculatePrice(router.query)

  return (
    <div className="flex flex-col gap-8 items-center">
      <BackLink href='/'>Cancel</BackLink>

      <PageHeading>Checkout {amount.toString()} SOL</PageHeading>
    </div>
  )
}
