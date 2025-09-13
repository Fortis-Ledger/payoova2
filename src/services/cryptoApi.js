// Cryptocurrency API service for real-time price data

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const COINMARKETCAP_API_BASE = 'https://pro-api.coinmarketcap.com/v1';

// CoinGecko API (free tier)
class CoinGeckoAPI {
  constructor() {
    this.baseURL = COINGECKO_API_BASE;
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  async fetchPrices(coinIds = ['bitcoin', 'ethereum', 'matic-network', 'binancecoin']) {
    const cacheKey = coinIds.sort().join(',');
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.baseURL}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform data to match our format
      const transformedData = {
        BTC: {
          price: data.bitcoin?.usd || 0,
          change24h: data.bitcoin?.usd_24h_change || 0,
          marketCap: data.bitcoin?.usd_market_cap || 0
        },
        ETH: {
          price: data.ethereum?.usd || 0,
          change24h: data.ethereum?.usd_24h_change || 0,
          marketCap: data.ethereum?.usd_market_cap || 0
        },
        MATIC: {
          price: data['matic-network']?.usd || 0,
          change24h: data['matic-network']?.usd_24h_change || 0,
          marketCap: data['matic-network']?.usd_market_cap || 0
        },
        BNB: {
          price: data.binancecoin?.usd || 0,
          change24h: data.binancecoin?.usd_24h_change || 0,
          marketCap: data.binancecoin?.usd_market_cap || 0
        }
      };
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching prices from CoinGecko:', error);
      return this.getFallbackPrices();
    }
  }

  async fetchCoinDetails(coinId) {
    try {
      const response = await fetch(
        `${this.baseURL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching coin details:', error);
      return null;
    }
  }

  async fetchMarketChart(coinId, days = 7) {
    try {
      const response = await fetch(
        `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching market chart:', error);
      return null;
    }
  }

  getFallbackPrices() {
    // Fallback prices in case API fails
    return {
      BTC: { price: 45000, change24h: 2.5, marketCap: 850000000000 },
      ETH: { price: 3200, change24h: 1.8, marketCap: 380000000000 },
      MATIC: { price: 0.85, change24h: -0.5, marketCap: 8000000000 },
      BNB: { price: 320, change24h: 0.8, marketCap: 52000000000 }
    };
  }
}

// Gas price estimation service
class GasEstimationAPI {
  constructor() {
    this.ethGasStationURL = 'https://ethgasstation.info/api/ethgasAPI.json';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  async fetchGasPrices() {
    const cached = this.cache.get('gasPrices');
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Try multiple gas APIs
      const gasData = await this.fetchFromMultipleSources();
      
      this.cache.set('gasPrices', {
        data: gasData,
        timestamp: Date.now()
      });
      
      return gasData;
    } catch (error) {
      console.error('Error fetching gas prices:', error);
      return this.getFallbackGasPrices();
    }
  }

  async fetchFromMultipleSources() {
    // Try to fetch from multiple sources for reliability
    const sources = [
      () => this.fetchFromEthGasStation(),
      () => this.fetchFromWeb3Provider(),
      () => this.getFallbackGasPrices()
    ];

    for (const source of sources) {
      try {
        const result = await source();
        if (result) return result;
      } catch (error) {
        console.warn('Gas price source failed:', error);
        continue;
      }
    }

    return this.getFallbackGasPrices();
  }

  async fetchFromEthGasStation() {
    const response = await fetch(this.ethGasStationURL);
    if (!response.ok) throw new Error('EthGasStation API failed');
    
    const data = await response.json();
    return {
      slow: Math.round(data.safeLow / 10),
      standard: Math.round(data.standard / 10),
      fast: Math.round(data.fast / 10),
      instant: Math.round(data.fastest / 10)
    };
  }

  async fetchFromWeb3Provider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const gasPrice = await window.ethereum.request({
          method: 'eth_gasPrice'
        });
        
        const gasPriceGwei = parseInt(gasPrice, 16) / 1e9;
        
        return {
          slow: Math.round(gasPriceGwei * 0.8),
          standard: Math.round(gasPriceGwei),
          fast: Math.round(gasPriceGwei * 1.2),
          instant: Math.round(gasPriceGwei * 1.5)
        };
      } catch (error) {
        throw new Error('Web3 gas price fetch failed');
      }
    }
    throw new Error('No Web3 provider available');
  }

  getFallbackGasPrices() {
    return {
      slow: 20,
      standard: 25,
      fast: 35,
      instant: 50
    };
  }
}

// Token balance fetching service
class TokenBalanceAPI {
  constructor() {
    this.alchemyAPIKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    this.infuraAPIKey = import.meta.env.VITE_INFURA_API_KEY;
  }

  async fetchTokenBalances(address, chainId = 1) {
    try {
      // Try Alchemy first, then Infura, then fallback
      if (this.alchemyAPIKey) {
        return await this.fetchFromAlchemy(address, chainId);
      } else if (this.infuraAPIKey) {
        return await this.fetchFromInfura(address, chainId);
      } else {
        return await this.fetchFromPublicRPC(address, chainId);
      }
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  }

  async fetchFromAlchemy(address, chainId) {
    const networkMap = {
      1: 'eth-mainnet',
      137: 'polygon-mainnet',
      56: 'bnb-mainnet'
    };
    
    const network = networkMap[chainId] || 'eth-mainnet';
    const url = `https://${network}.g.alchemy.com/v2/${this.alchemyAPIKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'alchemy_getTokenBalances',
        params: [address],
        id: 1
      })
    });
    
    const data = await response.json();
    return data.result?.tokenBalances || [];
  }

  async fetchFromInfura(address, chainId) {
    const networkMap = {
      1: 'mainnet',
      137: 'polygon-mainnet',
      56: 'bsc-mainnet'
    };
    
    const network = networkMap[chainId] || 'mainnet';
    const url = `https://${network}.infura.io/v3/${this.infuraAPIKey}`;
    
    // Infura doesn't have a direct token balance method, so we'd need to implement
    // individual token contract calls here
    return [];
  }

  async fetchFromPublicRPC(address, chainId) {
    // Fallback to public RPC endpoints
    const rpcUrls = {
      1: 'https://eth.llamarpc.com',
      137: 'https://polygon.llamarpc.com',
      56: 'https://binance.llamarpc.com'
    };
    
    const url = rpcUrls[chainId];
    if (!url) return [];
    
    // For now, return empty array - would need to implement token contract calls
    return [];
  }
}

// Main API service that combines all functionality
class CryptoAPIService {
  constructor() {
    this.priceAPI = new CoinGeckoAPI();
    this.gasAPI = new GasEstimationAPI();
    this.tokenAPI = new TokenBalanceAPI();
  }

  async getPrices(coins) {
    return await this.priceAPI.fetchPrices(coins);
  }

  async getGasPrices() {
    return await this.gasAPI.fetchGasPrices();
  }

  async getTokenBalances(address, chainId) {
    return await this.tokenAPI.fetchTokenBalances(address, chainId);
  }

  async getCoinDetails(coinId) {
    return await this.priceAPI.fetchCoinDetails(coinId);
  }

  async getMarketChart(coinId, days) {
    return await this.priceAPI.fetchMarketChart(coinId, days);
  }
}

// Export singleton instance
export const cryptoAPI = new CryptoAPIService();
export default cryptoAPI;