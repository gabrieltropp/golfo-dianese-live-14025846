import { useEffect, useState } from "react";
import { Download, Share, X, SquarePlus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_KEY = "install-banner-dismissed";

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppBanner({
  onVisibleChange,
}: {
  onVisibleChange?: (visible: boolean) => void;
}) {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === "1") return;

    if (isIOS()) {
      // iOS non ha un prompt di installazione nativo: l'unico modo è
      // mostrare le istruzioni per farlo a mano tramite il menu Condividi.
      setVisible(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Evento reale, indipendente da come l'installazione è avvenuta
    // (pulsante nostro o icona nativa del browser): conteggio anonimo.
    const onInstalled = () => {
      supabase.from("app_events").insert({ evento: "android_installed" }).then();
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) {
      setShowIosHint(true);
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  return (
    <div className="glass-soft fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl p-4 shadow-lg sm:inset-x-auto sm:right-4">
      <SquarePlus className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
      <div className="flex-1">
        {isIOS() ? (
          <>
            <p className="text-sm font-bold">{t("install.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("install.iosStep1")} <Share className="inline size-4 align-text-bottom" />{" "}
              {t("install.iosStep2")}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold">{t("install.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("install.androidHint")}</p>
            <button
              onClick={install}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Download className="size-4" /> {t("install.cta")}
            </button>
          </>
        )}
      </div>
      <button onClick={dismiss} aria-label={t("install.dismiss")} className="shrink-0 p-1">
        <X className="size-4" />
      </button>
    </div>
  );
}
