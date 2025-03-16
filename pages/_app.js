// pages/_app.js
import { AuthProvider } from '../lib/auth'; // Import the AuthProvider

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
