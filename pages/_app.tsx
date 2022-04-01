import '../styles/globals.css'
import { AppContext, AppProps, default as NextApp } from 'next/app'
import Layout from '../components/Layout'
import Head from 'next/head'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ConfigProvider } from '../contexts/ConfigProvider'

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

interface MyAppProps extends AppProps {
  host: string;
}

function MyApp({ Component, pageProps, host }: MyAppProps) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = clusterApiUrl(network);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
  ];

  const baseUrl = `https://${host}`;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Layout>
            <Head>
              <title>Cookies Inc</title>
            </Head>
            <ConfigProvider baseUrl={baseUrl}>
              <Component {...pageProps} />
            </ConfigProvider>
          </Layout>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const props = await NextApp.getInitialProps(appContext)
  const { req } = appContext.ctx;
  const host = req?.headers.host || 'localhost:3001';

  return {
    ...props,
    host,
  };
};

export default MyApp