// pages/_app.js
import { useTelegramWebApp } from '../components/TelegramWebApp';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  useTelegramWebApp();
  
  return <Component {...pageProps} />;
}

export default MyApp;