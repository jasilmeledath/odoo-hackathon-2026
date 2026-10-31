// Error recovery control shared by report data sections (PS-24).
import { Alert } from '../../components/ui.jsx';

export default function ReportLoadError({ message, onRetry, retryLabel }) {
  if (!message) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3" role="alert">
      <div className="min-w-0 flex-1">
        <Alert>{message}</Alert>
      </div>
      <button
        type="button"
        className="btn-secondary min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        onClick={onRetry}
      >
        {retryLabel}
      </button>
    </div>
  );
}
