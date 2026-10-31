// Revenue chart and filtered reports (PS-24).
import { PageHeader } from '../../components/ui.jsx';
import RevenueChart from './RevenueChart.jsx';

export default function Reports() {
  return (
    <>
      <PageHeader title="Reports" subtitle="Filter revenue, invoices and subscriptions" />
      <RevenueChart />
    </>
  );
}
