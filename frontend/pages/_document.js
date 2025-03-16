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
          
          {/* Direct CDN links to ensure all necessary Highcharts styles are loaded */}
          <link rel="stylesheet" href="https://code.highcharts.com/css/stocktools/gui.css" />
          <link rel="stylesheet" href="https://code.highcharts.com/css/annotations/popup.css" />
          
          {/* Add any other global styles here */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
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