import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          {/* Custom styles for Highcharts */}
          <link rel="stylesheet" href="/css/highcharts-stock-tools.css" />
          <link rel="stylesheet" href="/css/toolbar-icons.css" />
          
          {/* Direct CDN links to ensure all necessary Highcharts styles are loaded */}
          <link rel="stylesheet" href="https://code.highcharts.com/css/stocktools/gui.css" />
          <link rel="stylesheet" href="https://code.highcharts.com/css/annotations/popup.css" />
          
          {/* Add any other global styles here */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          
          {/* Global style overrides for Highcharts components */}
          <style>{`
            /* Force the stock tools wrapper to be visible */
            .highcharts-stocktools-wrapper {
              visibility: visible !important;
              display: flex !important;
              flex-direction: column !important;
              opacity: 1 !important;
              z-index: 99 !important;
              position: absolute !important;
              top: 50px !important;
              left: 10px !important;
              right: auto !important;
              bottom: auto !important;
              width: auto !important;
              min-width: 60px !important;
              height: auto !important;
              background-color: white !important;
              border: 1px solid #ddd !important;
              border-radius: 4px !important;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
              padding: 10px !important;
              max-height: 70vh !important;
              overflow-y: auto !important;
            }
            
            .highcharts-stocktools-toolbar {
              display: flex !important;
              flex-direction: column !important;
              gap: 10px !important;
            }
            
            .highcharts-menu-item {
              margin: 4px !important;
              padding: 10px !important;
              cursor: pointer !important;
              border-radius: 4px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              background-color: #f8f8f8 !important;
              border: 1px solid #eee !important;
            }
            
            .highcharts-menu-item:hover {
              background-color: #f0f0f0 !important;
              border-color: #ddd !important;
            }
            
            .highcharts-stocktools-toolbar {
              display: flex !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
            
            .highcharts-menu-item-btn {
              width: 32px !important;
              height: 32px !important;
              display: block !important;
              margin: 0 auto !important;
              background-size: contain !important;
              background-position: center !important;
              background-repeat: no-repeat !important;
            }
            
            .highcharts-menu-item::after {
              content: attr(title);
              font-size: 10px;
              margin-top: 5px;
              text-align: center;
              white-space: nowrap;
            }
            
            .highcharts-popup {
              width: auto !important;
              max-width: 200px !important;
            }
            
            .highcharts-annotation {
              z-index: 2 !important;
            }
            
            .highcharts-credits {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              height: 0 !important;
            }
          `}</style>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument; 