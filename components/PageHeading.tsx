import { PropsWithChildren } from "react";

export default function PageHeading({ children }: PropsWithChildren<{}>) {
  return <h3 className="text-6xl font-bold">{children}</h3>
}
