'use client';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Fenêtre de confirmation générique — thème bleu marine/blanc, remplace window.confirm(). */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm p-4 overlay-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-[#F1F5F9] max-w-md w-[95vw] overflow-hidden modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#006A8C] px-5 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-white text-2xl">
            {danger ? 'warning' : 'help'}
          </span>
          <h3 className="text-white font-bold text-base">{title}</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-[#475569]">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-[#475569] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all active:scale-95 ${
              danger
                ? 'bg-[#E11D48] hover:bg-[#BE123C]'
                : 'bg-[#006A8C] hover:bg-[#005a76]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
