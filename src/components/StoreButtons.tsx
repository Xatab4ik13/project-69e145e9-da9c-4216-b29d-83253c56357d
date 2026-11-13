// Кнопки магазинов приложений с логотипами Apple и Google Play.
import apkAsset from "@/assets/aquarius-apk.asset.json";

// На боевом домене APK отдаёт сервер из /app/aquarius.apk,
// в превью Lovable — файловое хранилище проекта.
const APK_URL =
  typeof window !== "undefined" && window.location.hostname.endsWith("aquariuswash.ru")
    ? "/app/aquarius.apk"
    : apkAsset.url;
export function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

export function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 26" className={className} aria-hidden>
      <path d="M1.2.5 13.3 12.6 1.2 24.7c-.4-.3-.7-.8-.7-1.5V2c0-.7.3-1.2.7-1.5Z" fill="#00D7FE" />
      <path d="m17.4 8.5-4.1 4.1L1.2.5c.4-.3 1-.3 1.6 0l14.6 8Z" fill="#00F076" />
      <path d="M17.4 16.7 2.8 24.7c-.6.3-1.2.3-1.6 0l12.1-12.1 4.1 4.1Z" fill="#FF3A44" />
      <path d="m22.3 11.2-4.9-2.7-4.1 4.1 4.1 4.1 4.9-2.7c1.2-.7 1.2-2.1 0-2.8Z" fill="#FFD500" />
    </svg>
  );
}

const BTN =
  "inline-flex items-center gap-2 rounded-lg border border-foreground bg-background px-4 py-1.5 font-semibold leading-tight";

export function AppStoreButton({ className = "" }: { className?: string }) {
  return (
    <a href="#" className={`${BTN} ${className}`}>
      <AppleLogo className="h-6 w-6 shrink-0" />
      <span className="flex flex-col text-left"><span className="text-[10px] font-normal">Загрузите в</span>App Store</span>
    </a>
  );
}

export function GooglePlayButton({ className = "" }: { className?: string }) {
  return (
    <a href={APK_URL} download="aquarius.apk" className={`${BTN} ${className}`}>
      <GooglePlayLogo className="h-6 w-6 shrink-0" />
      <span className="flex flex-col text-left"><span className="text-[10px] font-normal">Скачать для</span>Android</span>
    </a>
  );
}
