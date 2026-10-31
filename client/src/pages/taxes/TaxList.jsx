// Tax and payment-term administration share one catalog page (PS-10, PS-12).
import { PageHeader } from '../../components/ui.jsx';
import TaxTermSection from './TaxTermSection.jsx';

export default function TaxList() {
  return (
    <>
      <PageHeader title="Taxes" subtitle="Tax rules and payment terms for subscriptions" />
      <div className="space-y-6">
        <TaxTermSection kind="taxes" />
        <TaxTermSection kind="payment-terms" />
      </div>
    </>
  );
}
