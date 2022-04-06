import 'react-circular-progressbar/dist/styles.css';
import BackLink from '../../components/BackLink';
import Confirmed from '../../components/Confirmed';
import PageHeading from '../../components/PageHeading';

export default function ConfirmedPage() {
  return (
    <div className='flex flex-col gap-8 items-center'>
      <BackLink href='/shop'>Next order</BackLink>

      <PageHeading>Thankyou, enjoy your cookies!</PageHeading>

      <div className='h-80 w-80'><Confirmed /></div>
    </div>
  )
}
