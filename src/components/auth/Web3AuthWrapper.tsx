'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3Auth } from '@/services/web3AuthService';
import { useAccount, useSignMessage } from 'wagmi';

interface Web3AuthWrapperProps {
  children: (web3Auth: {
    openAuthModal: () => Promise<any>;
    wagmiAddress?: string;
    wagmiIsConnected: boolean;
    wagmiChainId?: number;
    signMessageAsync: (params: { message: string }) => Promise<string>;
  }) => React.ReactNode;
}

export function Web3AuthWrapper({ children }: Web3AuthWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  // Only use Web3 hooks after client-side hydration
  const { openAuthModal } = useWeb3Auth();
  const { address: wagmiAddress, isConnected: wagmiIsConnected, chainId: wagmiChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  return (
    <>
      {children({
        openAuthModal,
        wagmiAddress,
        wagmiIsConnected,
        wagmiChainId,
        signMessageAsync,
      })}
    </>
  );
}
