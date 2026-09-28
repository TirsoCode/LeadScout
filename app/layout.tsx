import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Título en serif, igual que ProfScout (SPEC.md).
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://leadscout.vercel.app"),
  title: {
    default: "LeadScout — Encuentra clientes potenciales automáticamente",
    template: "%s · LeadScout",
  },
  description:
    "Pega la URL de tu negocio y la IA encuentra en Reddit a personas que necesitan exactamente tu servicio. Con porcentaje de afinidad incluido.",
  keywords: [
    "lead generation",
    "prospectos",
    "scraping reddit",
    "generación de leads con IA",
    "ventas B2B",
  ],
  openGraph: {
    title: "LeadScout — Encuentra clientes potenciales automáticamente",
    description:
      "Pega la URL de tu negocio y descubre quién necesita tu servicio, en Reddit.",
    type: "website",
    url: "https://leadscout.vercel.app",
    siteName: "LeadScout",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadScout — Encuentra clientes potenciales automáticamente",
    description: "Pega la URL de tu negocio y descubre quién necesita tu servicio.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `bg-bg` + color inline en <html> y <body>: el inline sobrevive aunque el
    // CSS tarde en cargar o quede cacheado, así que nunca hay flash del color
    // equivocado.
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} bg-bg`}
      style={{ backgroundColor: "#ffffff" }}
    >
      <body className="min-h-screen bg-bg font-sans text-ink" style={{ backgroundColor: "#ffffff" }}>
        {children}
      </body>
    </html>
  );
}
