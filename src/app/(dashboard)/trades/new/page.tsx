import TradeForm from '@/components/TradeForm';

export default function NewTradePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-bold text-tj-text mb-5">Nieuwe Trade</h1>
      <div className="bg-tj-card border border-tj-border rounded-xl p-4 sm:p-6">
        <TradeForm />
      </div>
    </div>
  );
}
