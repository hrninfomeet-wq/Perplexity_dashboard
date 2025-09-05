// frontend/src/components/shared/ConnectButton.jsx
import React, { useState } from 'react';
import { ChevronDownIcon, LinkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const API_PROVIDERS = [
  {
    id: 'flattrade',
    name: 'Flattrade',
    status: 'available',
    description: 'Professional trading platform with advanced features',
    icon: '📈'
  },
  {
    id: 'upstox',
    name: 'Upstox',
    status: 'available',
    description: 'Modern trading platform with competitive pricing',
    icon: '🚀'
  },
  {
    id: 'fyers',
    name: 'FYERS',
    status: 'available',
    description: 'Technology-driven trading platform',
    icon: '⚡'
  },
  {
    id: 'aliceblue',
    name: 'Alice Blue',
    status: 'available',
    description: 'Zero brokerage trading platform',
    icon: '💎'
  },
  {
    id: 'nse_public',
    name: 'NSE Public',
    status: 'available',
    description: 'Free public data (limited features)',
    icon: '🏛️'
  }
];

const ConnectButton = ({ onProviderSelect, selectedProvider, isConnected, connectionStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleProviderSelection = async (provider) => {
    setIsConnecting(true);
    setIsOpen(false);
    
    try {
      await onProviderSelect(provider);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const getButtonText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected && selectedProvider) {
      return `Connected: ${selectedProvider.name}`;
    }
    return 'Connect to Market Data';
  };

  const getButtonIcon = () => {
    if (isConnecting) return '🔄';
    if (isConnected) return '✅';
    return '🔗';
  };

  return (
    <div className="relative inline-block">
      {/* Main Connect Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isConnecting}
        className={clsx(
          'flex items-center justify-between min-w-[280px] px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200',
          {
            'bg-green-600 border-green-600 text-white hover:bg-green-700': isConnected,
            'bg-blue-600 border-blue-600 text-white hover:bg-blue-700': !isConnected && !isConnecting,
            'bg-gray-400 border-gray-400 text-white cursor-not-allowed': isConnecting,
          }
        )}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getButtonIcon()}</span>
          <span>{getButtonText()}</span>
        </div>
        <ChevronDownIcon 
          className={clsx('h-4 w-4 transition-transform duration-200', {
            'transform rotate-180': isOpen
          })} 
        />
      </button>

      {/* Connection Status Indicator */}
      {connectionStatus && (
        <div className="mt-2 text-xs text-gray-600">
          {connectionStatus}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 z-20 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Select API Provider</h3>
              <p className="text-xs text-gray-500 mt-1">Choose your preferred market data source</p>
            </div>
            
            <div className="p-2">
              {API_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelection(provider)}
                  disabled={provider.status !== 'available'}
                  className={clsx(
                    'w-full text-left p-3 rounded-lg transition-colors duration-150 mb-2 last:mb-0',
                    {
                      'hover:bg-blue-50 border border-transparent hover:border-blue-200': provider.status === 'available',
                      'bg-gray-50 cursor-not-allowed opacity-60': provider.status !== 'available',
                      'bg-blue-100 border border-blue-300': selectedProvider?.id === provider.id
                    }
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">{provider.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">{provider.name}</h4>
                          {selectedProvider?.id === provider.id && (
                            <CheckIcon className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{provider.description}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className={clsx('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', {
                            'bg-green-100 text-green-800': provider.status === 'available',
                            'bg-yellow-100 text-yellow-800': provider.status === 'limited',
                            'bg-gray-100 text-gray-800': provider.status === 'unavailable'
                          })}>
                            {provider.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                💡 Tip: Each provider offers different features and rate limits. Choose based on your trading needs.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectButton;
