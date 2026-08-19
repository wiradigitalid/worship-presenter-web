import ThemeProvider from "@/components/ThemeProvider";
import { getUiLocale } from "@/lib/settings";
import "../globals.css";

const metadata = {
  title: "Worship Presenter Web",
  description: "Operator hub for preparing and projecting a worship service.",
};

void metadata;

/** `ui_locale` is read from SQLite on every request — static `lang` would lie. */
export default function OperatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = getUiLocale();

  return (
    // next-themes writes the theme class onto <html> before React hydrates, so
    // the server and client markup differ here by design. Without the
    // suppression React logs that expected mismatch as an error.
    <html
      lang={lang}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
