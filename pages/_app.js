import React from 'react';
import { ToastContainer } from 'react-toastify';
import { AppProvider } from '../contexts/AppContext';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/highstock-styles.css';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AppProvider>
      <Component {...pageProps} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AppProvider>
  );
}

export default MyApp; 