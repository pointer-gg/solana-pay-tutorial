import { useRef } from "react";
import { products } from "../lib/products"
import NumberInput from "./NumberInput";

interface Props {
  submitTarget: string;
  enabled: boolean;
}

export default function Products({ submitTarget, enabled }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form method='get' action={submitTarget} ref={formRef}>
      <div className='flex flex-col gap-16'>
        <div className="grid grid-cols-2 gap-8">
          {products.map(product => {
            return (
              <div className="p-8 text-left bg-white rounded-md" key={product.id}>
                <h3 className="text-2xl font-bold">{product.name}</h3>
                <p className="text-sm text-gray-800">{product.description}</p>
                <p className="my-4">
                  <span className="mt-4 text-xl font-bold">${product.priceUsd}</span>
                  {product.unitName && <span className="text-sm text-gray-800"> /{product.unitName}</span>}
                </p>
                <div className="mt-1">
                  <NumberInput name={product.id} formRef={formRef} />
                </div>
              </div>
            )
          })}

        </div>

        <button
          className="items-center self-center px-20 py-2 text-white bg-gray-900 rounded-md max-w-fit hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!enabled}
        >
          Checkout
        </button>
      </div>
    </form>
  )
}
