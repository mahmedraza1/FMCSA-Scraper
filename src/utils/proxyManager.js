import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

class ProxyManager {
  constructor(proxies = []) {
    this.proxies = proxies;
    this.currentProxyIndex = 0;
    this.consecutiveFailures = Array(proxies.length).fill(0);
    this.maxConsecutiveFailures = 3; // Switch proxy after 3 consecutive failures
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.healthCheckInterval = null;
    
    // Initialize health check if proxies are provided
    if (proxies.length > 0) {
      this.startHealthChecks();
    }
  }
  
  /**
   * Set the list of proxies to use
   * @param {Array} proxies - Array of proxy strings, e.g., ["http://user:pass@ip:port", "socks5://ip:port"]
   */
  setProxies(proxies) {
    this.proxies = proxies;
    this.consecutiveFailures = Array(proxies.length).fill(0);
    this.currentProxyIndex = 0;
    console.log(`Set ${proxies.length} proxies for rotation.`);
    
    // Start health checks
    this.startHealthChecks();
  }
  
  /**
   * Get the current proxy
   * @returns {string} The current proxy URL
   */
  getCurrentProxy() {
    if (this.proxies.length === 0) {
      return null;
    }
    return this.proxies[this.currentProxyIndex];
  }
  
  /**
   * Get the current proxy agent for fetch
   * @returns {Object} The proxy agent to use with fetch
   */
  getCurrentProxyAgent() {
    const proxy = this.getCurrentProxy();
    if (!proxy) {
      return null;
    }
    
    if (proxy.startsWith('socks')) {
      return new SocksProxyAgent(proxy);
    } else {
      return new HttpsProxyAgent(proxy);
    }
  }
  
  /**
   * Rotate to the next proxy
   * @param {boolean} forced - If true, force rotate even if the current proxy is working
   * @returns {string} The new current proxy URL
   */
  rotateProxy(forced = false) {
    if (this.proxies.length === 0) {
      return null;
    }
    
    // Only rotate if forced or the current proxy has failed too many times
    if (forced || this.consecutiveFailures[this.currentProxyIndex] >= this.maxConsecutiveFailures) {
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
      console.log(`Rotated to proxy: ${this.getCurrentProxy()}`);
    }
    
    return this.getCurrentProxy();
  }
  
  /**
   * Mark the current proxy as failed
   */
  markCurrentProxyFailed() {
    if (this.proxies.length === 0) {
      return;
    }
    
    this.consecutiveFailures[this.currentProxyIndex]++;
    this.failedRequests++;
    
    console.log(`Proxy ${this.getCurrentProxy()} failed. Consecutive failures: ${this.consecutiveFailures[this.currentProxyIndex]}`);
    
    if (this.consecutiveFailures[this.currentProxyIndex] >= this.maxConsecutiveFailures) {
      this.rotateProxy(true);
    }
  }
  
  /**
   * Mark the current proxy as successful
   */
  markCurrentProxySuccessful() {
    if (this.proxies.length === 0) {
      return;
    }
    
    // Reset consecutive failures counter for this proxy
    this.consecutiveFailures[this.currentProxyIndex] = 0;
    this.successfulRequests++;
  }
  
  /**
   * Fetch with proxy rotation and retry logic
   * @param {string} url - The URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise} - The fetch response
   */
  async fetchWithProxy(url, options = {}, maxRetries = 3) {
    this.totalRequests++;
    let retries = 0;
    
    while (retries <= maxRetries) {
      const proxyAgent = this.getCurrentProxyAgent();
      try {
        // If we have a proxy, use it, otherwise make a direct request
        const fetchOptions = {
          ...options,
          agent: proxyAgent || options.agent,
          timeout: 30000, // 30 second timeout
        };
        
        const response = await fetch(url, fetchOptions);
        
        // If we get a 403 or 429, rotate proxy and retry
        if (response.status === 403 || response.status === 429) {
          this.markCurrentProxyFailed();
          retries++;
          continue; // Try the next proxy
        }
        
        // Any other non-2xx status is a failure but don't retry
        if (!response.ok) {
          this.markCurrentProxyFailed();
          return response; // Return the failed response
        }
        
        // Success!
        this.markCurrentProxySuccessful();
        return response;
      } catch (error) {
        console.error(`Proxy fetch error with ${this.getCurrentProxy()}: ${error.message}`);
        this.markCurrentProxyFailed();
        retries++;
        
        // If this was our last retry, throw the error
        if (retries > maxRetries) {
          throw error;
        }
      }
    }
    
    throw new Error(`All proxies failed after ${maxRetries} retries.`);
  }
  
  /**
   * Start periodic health checks of all proxies
   */
  startHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Check every 5 minutes
    this.healthCheckInterval = setInterval(() => this.healthCheckAllProxies(), 5 * 60 * 1000);
  }
  
  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
  
  /**
   * Check health of all proxies
   */
  async healthCheckAllProxies() {
    console.log('Running health check on all proxies...');
    
    if (this.proxies.length === 0) {
      console.log('No proxies configured for health check.');
      return;
    }
    
    const results = [];
    
    for (let i = 0; i < this.proxies.length; i++) {
      const originalIndex = this.currentProxyIndex;
      this.currentProxyIndex = i;
      
      try {
        // Use a reliable endpoint to test proxy
        const testUrl = 'https://httpbin.org/ip';
        console.log(`Testing proxy ${this.proxies[i]} with ${testUrl}`);
        
        const response = await this.fetchWithProxy(testUrl, {}, 1);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Proxy ${this.proxies[i]} is working. IP: ${data.origin}`);
          this.consecutiveFailures[i] = 0;
          results.push({ proxy: this.proxies[i], working: true, ip: data.origin });
        } else {
          console.error(`❌ Proxy ${this.proxies[i]} health check failed with status: ${response.status}`);
          this.consecutiveFailures[i]++;
          results.push({ proxy: this.proxies[i], working: false, error: `Status: ${response.status}` });
        }
      } catch (error) {
        console.error(`❌ Proxy ${this.proxies[i]} health check error: ${error.message}`);
        this.consecutiveFailures[i]++;
        results.push({ proxy: this.proxies[i], working: false, error: error.message });
      }
      
      // Restore the original index
      this.currentProxyIndex = originalIndex;
    }
    
    return results;
  }
  
  /**
   * Get proxy statistics
   * @returns {Object} Statistics about proxy usage
   */
  getStats() {
    return {
      totalProxies: this.proxies.length,
      currentProxy: this.getCurrentProxy(),
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate: this.totalRequests > 0 ? 
        (this.successfulRequests / this.totalRequests * 100).toFixed(2) + '%' : '0%',
      proxyStatus: this.proxies.map((proxy, index) => ({
        proxy,
        consecutiveFailures: this.consecutiveFailures[index],
        healthy: this.consecutiveFailures[index] < this.maxConsecutiveFailures
      }))
    };
  }
  
  /**
   * Get all proxies currently configured
   * @returns {Array} The list of all proxies
   */
  getAllProxies() {
    return [...this.proxies];
  }
  
  /**
   * Get the current proxy index
   * @returns {number} The current proxy index
   */
  getCurrentProxyIndex() {
    return this.currentProxyIndex;
  }
  
  /**
   * Set the current proxy index
   * @param {number} index - The index to set
   */
  setCurrentProxyIndex(index) {
    if (index >= 0 && index < this.proxies.length) {
      this.currentProxyIndex = index;
      console.log(`Current proxy index set to ${index}`);
    } else if (this.proxies.length > 0) {
      this.currentProxyIndex = 0;
      console.log('Invalid index provided, reset to 0');
    }
  }
}

// Create a singleton instance
const proxyManagerInstance = new ProxyManager();

export default proxyManagerInstance;
