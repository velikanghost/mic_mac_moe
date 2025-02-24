import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from './ui/button'
import { ChevronDown } from 'lucide-react'

export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        const connected = ready && account && chain
        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    className="bg-white py-3 px-6 text-[#52238d] rounded-xl hover:shadow-xl font-medium"
                    onClick={openConnectModal}
                    type="button"
                  >
                    Connect Wallet
                  </button>
                )
              }
              if (chain.unsupported) {
                return (
                  <button
                    className="bg-white py-3 px-6 text-[#52238d] rounded-xl hover:shadow-xl font-medium flex items-center gap-4"
                    onClick={openChainModal}
                    type="button"
                  >
                    Wrong network <ChevronDown size={20} />
                  </button>
                )
              }
              return (
                <div className="flex gap-3">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-white hidden py-3 px-6 text-[#52238d] rounded-xl hover:shadow-xl font-medium md:flex items-center"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>
                  <button
                    onClick={openAccountModal}
                    className="bg-white hidden md:flex py-2 px-4 md:py-3 md:px-6 text-[#52238d] rounded-xl hover:shadow-xl font-medium items-center gap-1 md:gap-3"
                    type="button"
                  >
                    {account.displayName}
                    {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''}{' '}
                    <ChevronDown size={20} />
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
