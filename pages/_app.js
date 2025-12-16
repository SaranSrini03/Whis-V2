// Global wrapper to wire up ads and auth provider for the pages router.
import Script from "next/script";
import { AuthProvider } from "../lib/auth";

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Google AdSense */}
      <Script
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1984334076702409"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

export default MyApp;
