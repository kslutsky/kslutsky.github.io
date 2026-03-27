"use client";

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-auto p-6 border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        <p className="mt-2 text-sm text-stone-600">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-stone-700 border border-stone-300 shadow-sm hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              variant === "danger"
                ? "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 transition-colors duration-150"
                : "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
