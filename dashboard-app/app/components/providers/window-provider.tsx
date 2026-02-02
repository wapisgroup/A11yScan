"use client"

/**
 * WindowProvider
 * -------------
 * Unified "window-like" UI services that can be called from anywhere:
 * - confirm(): Promise<boolean>
 * - alert(): Promise<void>
 * - toast(): fire-and-forget notification
 *
 * This provider replaces the old ConfirmProvider concept.
 *
 * Backwards compatibility:
 * - `ConfirmProvider` is exported as an alias of `WindowProvider`
 * - `useConfirm` and `useAlert` keep the same API
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ConfirmDialog } from "@/components/molecule/confirm-dialog";
import { AlertDialog } from "@/components/molecule/alert-dialog";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type BaseDialogOptions = {
  title?: ReactNode;
  message: ReactNode;
  tone?: "default" | "danger";
};

type ConfirmOptions = BaseDialogOptions & {
  confirmLabel?: string;
  cancelLabel?: string;
};

type AlertOptions = BaseDialogOptions & {
  okLabel?: string;
};

type DialogMode = "confirm" | "alert";

export type ToastTone = "default" | "success" | "info" | "danger";

export type ToastOptions = {
  title?: ReactNode;
  message: ReactNode;
  tone?: ToastTone;
  /** Default 3500ms. Set to 0 to require manual close. */
  durationMs?: number;
};

type ToastItem = {
  id: string;
  title?: ReactNode;
  message: ReactNode;
  tone: ToastTone;
  createdAt: number;
};

type WindowContextValue = {
  /** Confirm dialog (resolves true/false). */
  confirm: (options: ConfirmOptions) => Promise<boolean>;

  /** Alert dialog (resolves when user clicks OK). */
  alert: (options: AlertOptions) => Promise<void>;

  /** Toast notification (non-blocking). Returns toast id. */
  toast: (options: ToastOptions) => string;

  /** Optional controls for toasts. */
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const WindowContext = createContext<WindowContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const makeId = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const toastToneClasses = (tone: ToastTone): string => {
  // Keep styling conservative and consistent with existing UI.
  // You can swap these to your design system later.
  switch (tone) {
    case "success":
      return "border-emerald-200";
    case "info":
      return "border-sky-200";
    case "danger":
      return "border-red-200";
    default:
      return "border-slate-200";
  }
};

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function WindowProvider({ children }: { children: ReactNode }) {
  // Dialog state
  const [open, setOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<DialogMode>("confirm");
  const [options, setOptions] = useState<ConfirmOptions | AlertOptions | null>(
    null
  );
  const [resolver, setResolver] = useState<((v: boolean | void) => void) | null>(
    null
  );

  // Toast state
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimers = useRef<Map<string, number>>(new Map());

  /**
   * confirm()
   * ---------
   * Opens the confirm dialog and resolves a boolean.
   */
  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setMode("confirm");
        setOptions(opts);
        setResolver(() => resolve);
        setOpen(true);
      }),
    []
  );

  /**
   * alert()
   * -------
   * Opens the alert dialog and resolves when dismissed.
   */
  const alert = useCallback(
    (opts: AlertOptions) =>
      new Promise<void>((resolve) => {
        setMode("alert");
        setOptions(opts);
        setResolver(() => resolve);
        setOpen(true);
      }),
    []
  );

  /**
   * closeDialog()
   * -------------
   * Closes confirm/alert and resolves any pending promise.
   */
  const closeDialog = useCallback(
    (result?: boolean) => {
      setOpen(false);
      resolver?.(result);
      setResolver(null);
      setOptions(null);
    },
    [resolver]
  );

  /** Dismiss a single toast (and clear its timer). */
  const dismissToast = useCallback((id: string) => {
    const t = toastTimers.current.get(id);
    if (t) window.clearTimeout(t);
    toastTimers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  /** Remove all toasts. */
  const clearToasts = useCallback(() => {
    toastTimers.current.forEach((t) => window.clearTimeout(t));
    toastTimers.current.clear();
    setToasts([]);
  }, []);

  /**
   * toast()
   * -------
   * Adds a toast to the stack and auto-dismisses after `durationMs`.
   */
  const toast = useCallback(
    (opts: ToastOptions): string => {
      const id = makeId();
      const tone: ToastTone = opts.tone ?? "default";
      const durationMs = opts.durationMs ?? 3500;

      const item: ToastItem = {
        id,
        title: opts.title,
        message: opts.message,
        tone,
        createdAt: Date.now(),
      };

      // Show newest first, keep the stack small.
      setToasts((prev) => [item, ...prev].slice(0, 5));

      if (durationMs > 0) {
        const timer = window.setTimeout(() => dismissToast(id), durationMs);
        toastTimers.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const value = useMemo<WindowContextValue>(
    () => ({ confirm, alert, toast, dismissToast, clearToasts }),
    [confirm, alert, toast, dismissToast, clearToasts]
  );

  return (
    <WindowContext.Provider value={value}>
      {children}

      {/* Confirm dialog */}
      {mode === "confirm" && (
        <ConfirmDialog
          open={open}
          title={options?.title ?? "Confirm"}
          message={options?.message ?? ""}
          confirmLabel={(options as ConfirmOptions | null)?.confirmLabel}
          cancelLabel={(options as ConfirmOptions | null)?.cancelLabel}
          tone={options?.tone}
          onCancel={() => closeDialog(false)}
          onConfirm={() => closeDialog(true)}
        />
      )}

      {/* Alert dialog */}
      {mode === "alert" && (
        <AlertDialog
          open={open}
          title={options?.title ?? "Alert"}
          message={options?.message ?? ""}
          okLabel={(options as AlertOptions | null)?.okLabel}
          tone={options?.tone}
          onOk={() => closeDialog()}
        />
      )}

      {/* Toast stack (top-right) */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl shadow-xl bg-white border p-4 ${toastToneClasses(t.tone)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {t.title ? (
                  <div className="as-p2-text primary-text-color">{t.title}</div>
                ) : null}
                <div className="as-p2-text secondary-text-color">{t.message}</div>
              </div>

              <button
                type="button"
                className="secondary-text-color hover:primary-text-color"
                aria-label="Dismiss toast"
                onClick={() => dismissToast(t.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </WindowContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/** Access to the full API if needed. */
export function useWindow(): WindowContextValue {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error("useWindow must be used within <WindowProvider>");
  return ctx;
}

/** Confirm-only hook (legacy). */
export function useConfirm() {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error("useConfirm must be used within <WindowProvider>");
  return ctx.confirm;
}

/** Alert-only hook (legacy). */
export function useAlert() {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error("useAlert must be used within <WindowProvider>");
  return ctx.alert;
}

/** Toast-only hook. */
export function useToast() {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error("useToast must be used within <WindowProvider>");
  return ctx.toast;
}

/* -------------------------------------------------------------------------- */
/* Backwards-compatible export                                                 */
/* -------------------------------------------------------------------------- */

/**
 * ConfirmProvider (deprecated)
 * ----------------------------
 * Alias kept so existing imports don’t break.
 * Prefer `WindowProvider` going forward.
 */
export const ConfirmProvider = WindowProvider;