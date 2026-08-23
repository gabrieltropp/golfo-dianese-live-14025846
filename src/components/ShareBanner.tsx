import { useEffect, useState } from "react";
import { Check, Copy, Mail, Share2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const DISMISS_KEY = "share-banner-dismissed";
const SITE_URL = "https://golfo-dianese-live.lovable.app/";
const SHARE_TEXT = "Golfo Dianese Live — meteo, mare, acqua e mobilità del golfo, tutto in un posto";

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Compare solo quando si arriva in fondo alla pagina (footer visibile), e
 * mai insieme al banner di installazione se quello è ancora a schermo,
 * per non sovrapporre due avvisi fissi in basso contemporaneamente.
 */
export function ShareBanner({ installBannerVisible }: { installBannerVisible: boolean }) {
  const { t } = useI18n();
  const [reachedBottom, setReachedBottom] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === "1") return;

    const footer = document.querySelector("footer");
    if (!footer) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReachedBottom(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  const visible = reachedBottom && !dismissed && !installBannerVisible;
  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // niente clipboard disponibile: l'utente può comunque copiare a mano dal link mostrato
    }
  }

  const encodedUrl = encodeURIComponent(SITE_URL);
  const encodedText = encodeURIComponent(SHARE_TEXT);

  return (
    <div className="glass fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl p-4 shadow-lg sm:inset-x-auto sm:right-4">
      <Share2 className="mt-0.5 size-6 shrink-0 text-header-fg" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-bold text-header-fg">{t("share.title")}</p>
        <p className="mt-1 text-sm text-header-fg/80">{t("share.subtitle")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-xl bg-[#1877F2] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Facebook
          </a>
          <a
            href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-xl bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
          >
            WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(SHARE_TEXT)}&body=${encodedUrl}`}
            className="inline-flex items-center gap-1 rounded-xl bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold text-header-fg"
          >
            <Mail className="size-3.5" /> {t("share.email")}
          </a>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1 rounded-xl bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold text-header-fg"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? t("share.copied") : t("share.copyLink")}
          </button>
        </div>
      </div>
      <button onClick={dismiss} aria-label={t("install.dismiss")} className="shrink-0 p-1 text-header-fg">
        <X className="size-4" />
      </button>
    </div>
  );
}
