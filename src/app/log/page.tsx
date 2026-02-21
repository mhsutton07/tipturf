import { TopBar } from '@/components/layout/TopBar';
import { LogForm } from '@/components/log/LogForm';

export const metadata = { title: 'Log Delivery — TipTurf' };

export default function LogPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <TopBar title="Log a Delivery" />
      <div className="pt-14">
        <LogForm />
      </div>
    </div>
  );
}
