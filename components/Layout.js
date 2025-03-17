import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout = ({ children, title = 'GannSq9 - Trading Levels Calculator' }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Gann Square of 9 Trading Levels Calculator based on sun position" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="layout">
        <Navbar />
        <main className="container">
          {children}
        </main>
        <Footer />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        main {
          flex: 1;
          padding: 2rem 0;
        }
      `}</style>
    </>
  );
};

export default Layout; 