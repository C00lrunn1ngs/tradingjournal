'use client';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmModal({ onConfirm, onCancel, loading }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-tj-card border border-tj-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-semibold text-tj-text mb-2">Trade verwijderen?</h3>
        <p className="text-sm text-tj-muted mb-6">Deze actie kan niet ongedaan worden gemaakt.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-tj-border text-tj-text2 text-sm hover:bg-tj-hover transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-tj-red text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Verwijderen...' : 'Verwijderen'}
          </button>
        </div>
      </div>
    </div>
  );
}
