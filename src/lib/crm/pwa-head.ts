/** Manifest and app icons only for the CRM; the public site keeps its own favicon. */
export const CRM_PWA_LINKS = [
  { rel: "manifest", href: "/crm.webmanifest" },
  { rel: "apple-touch-icon", href: "/crm-apple-touch-icon.png" },
];
export const CRM_PWA_META = [
  { name: "theme-color", content: "#ffffff" },
  { name: "apple-mobile-web-app-capable", content: "yes" },
  { name: "mobile-web-app-capable", content: "yes" },
  { name: "apple-mobile-web-app-title", content: "CRM Аквариус" },
  { name: "apple-mobile-web-app-status-bar-style", content: "default" },
];
