// SSE connection manager with reconnection support
export class SSEConnectionManager {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.eventSource = null;
    this.sessionId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second delay
    this.handlers = {
      message: () => {},
      error: () => {},
      connected: () => {},
      disconnected: () => {}
    };
  }

  connect(sessionId) {
    if (!sessionId) {
      this.handlers.error(new Error('No session ID provided for SSE connection'));
      return false;
    }
    
    this.sessionId = sessionId;
    this.reconnectAttempts = 0;
    return this.createConnection();
  }
  
  createConnection() {
    // Close existing connection if any
    this.disconnect();
    
    try {
      // Create new SSE connection with session ID
      this.eventSource = new EventSource(`${this.baseUrl}/progress-events/${this.sessionId}`);
      
      // Set up event handlers
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlers.message(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      this.eventSource.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          this.handlers.connected(data);
        } catch (error) {
          console.error('Error parsing SSE connected event:', error);
        }
      });
      
      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        
        // Close the connection
        this.eventSource.close();
        this.eventSource = null;
        
        // Try to reconnect if we haven't exceeded the maximum attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
          
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
          
          setTimeout(() => {
            this.createConnection();
          }, delay);
        } else {
          // We've exceeded the maximum reconnect attempts
          this.handlers.error(new Error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`));
          this.handlers.disconnected();
        }
      };
      
      return true;
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      this.handlers.error(error);
      return false;
    }
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
  
  onMessage(callback) {
    this.handlers.message = callback;
  }
  
  onError(callback) {
    this.handlers.error = callback;
  }
  
  onConnected(callback) {
    this.handlers.connected = callback;
  }
  
  onDisconnected(callback) {
    this.handlers.disconnected = callback;
  }
  
  isConnected() {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}
