import { useEffect, useState, useRef, useCallback } from 'react';

interface ProgressUpdate {
  type: 'progress';
  jobId: number;
  status: string;
  progress: number;
  currentStep: string;
  errorMessage?: string | null;
}

interface SocketMessage {
  type: string;
  [key: string]: any;
}

export function useSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'authenticated'>('disconnected');
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const messageHandlersRef = useRef<Map<string, (message: SocketMessage) => void>>(new Map());
  const pendingSubscriptionsRef = useRef<Set<number>>(new Set());
  const activeSubscriptionsRef = useRef<Set<number>>(new Set());
  const connectionReadyRef = useRef(false);
  const subscriptionReadyTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      try {
        setConnectionState('connecting');
        // Use correct protocol and path for WebSocket connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected, waiting for authentication...');
          setConnectionState('connected');
          setIsConnected(true);
          setSocket(ws);
          reconnectAttemptsRef.current = 0;
          
          // Clear any existing subscription ready timeout
          if (subscriptionReadyTimeoutRef.current) {
            clearTimeout(subscriptionReadyTimeoutRef.current);
          }
          
          // Wait a short time for authentication to complete before processing subscriptions
          // This prevents the race condition where subscriptions are sent before auth is complete
          subscriptionReadyTimeoutRef.current = setTimeout(() => {
            connectionReadyRef.current = true;
            setConnectionState('authenticated');
            
            // Process any pending subscriptions after authentication is ready
            const pendingSubs = Array.from(pendingSubscriptionsRef.current);
            const activeSubs = Array.from(activeSubscriptionsRef.current);
            
            // Re-subscribe to all active subscriptions on reconnect
            const allSubs = new Set([...pendingSubs, ...activeSubs]);
            pendingSubscriptionsRef.current.clear();
            
            allSubs.forEach(jobId => {
              console.log('Processing subscription for job:', jobId, 'after authentication ready');
              try {
                ws.send(JSON.stringify({
                  type: 'subscribe',
                  jobId
                }));
              } catch (error) {
                console.error('Error sending subscription:', error);
                pendingSubscriptionsRef.current.add(jobId);
              }
            });
          }, 200); // Small delay to ensure authentication is complete
        };

        ws.onmessage = (event) => {
          try {
            const message: SocketMessage = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
            
            setLastMessage(message);
            
            // Handle subscription confirmations
            if (message.type === 'subscribed' && message.jobId) {
              activeSubscriptionsRef.current.add(message.jobId);
              pendingSubscriptionsRef.current.delete(message.jobId);
              console.log('Subscription confirmed for job:', message.jobId);
            }
            
            // Handle authentication/connection state changes
            if (message.type === 'error' && message.message?.includes('Authentication')) {
              setConnectionState('disconnected');
              connectionReadyRef.current = false;
            }
            
            // Call registered message handlers
            const handler = messageHandlersRef.current.get(message.type);
            if (handler) {
              handler(message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          setSocket(null);
          connectionReadyRef.current = false;
          setConnectionState('disconnected');
          
          // Clear subscription ready timeout
          if (subscriptionReadyTimeoutRef.current) {
            clearTimeout(subscriptionReadyTimeoutRef.current);
          }
          
          // Move active subscriptions back to pending for re-subscription on reconnect
          const activeSubs = Array.from(activeSubscriptionsRef.current);
          activeSubs.forEach(jobId => {
            pendingSubscriptionsRef.current.add(jobId);
          });
          activeSubscriptionsRef.current.clear();
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        return ws;
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        return null;
      }
    };

    const ws = connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (subscriptionReadyTimeoutRef.current) {
        clearTimeout(subscriptionReadyTimeoutRef.current);
      }
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, []);

  // Helper function to send messages safely
  const sendMessage = useCallback((message: string | object) => {
    if (socket && socket.readyState === WebSocket.OPEN && connectionReadyRef.current) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      socket.send(messageStr);
      return true;
    }
    return false;
  }, [socket]);

  // Helper function to subscribe to job updates with retry logic
  const subscribeToJob = useCallback((jobId: number) => {
    // Always add to active subscriptions to maintain state across reconnects
    activeSubscriptionsRef.current.add(jobId);
    
    if (socket && socket.readyState === WebSocket.OPEN && connectionReadyRef.current && connectionState === 'authenticated') {
      // Socket is ready, send subscription immediately
      const success = sendMessage({
        type: 'subscribe',
        jobId
      });
      if (success) {
        console.log('Successfully subscribed to job:', jobId);
        // Remove from pending if it was there
        pendingSubscriptionsRef.current.delete(jobId);
      } else {
        // If send failed, add to pending
        pendingSubscriptionsRef.current.add(jobId);
      }
      return success;
    } else {
      // Socket is not ready, queue the subscription
      console.log('Socket not ready, queuing subscription for job:', jobId, 'Connection state:', connectionState);
      pendingSubscriptionsRef.current.add(jobId);
      return false; // Indicates pending
    }
  }, [socket, sendMessage, connectionState]);

  // Helper function to register message handlers
  const onMessage = useCallback((type: string, handler: (message: SocketMessage) => void) => {
    messageHandlersRef.current.set(type, handler);
    
    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(type);
    };
  }, []);

  // Helper function to subscribe to progress updates for a specific job
  const onProgressUpdate = useCallback((handler: (update: ProgressUpdate) => void) => {
    return onMessage('progress', (message) => {
      if (message.type === 'progress') {
        handler(message as ProgressUpdate);
      }
    });
  }, [onMessage]);

  // Function to check if subscription is pending
  const isSubscriptionPending = useCallback((jobId: number) => {
    return pendingSubscriptionsRef.current.has(jobId);
  }, []);
  
  // Function to check if subscription is active
  const isSubscriptionActive = useCallback((jobId: number) => {
    return activeSubscriptionsRef.current.has(jobId);
  }, []);
  
  // Function to unsubscribe from a job
  const unsubscribeFromJob = useCallback((jobId: number) => {
    activeSubscriptionsRef.current.delete(jobId);
    pendingSubscriptionsRef.current.delete(jobId);
    
    if (socket && socket.readyState === WebSocket.OPEN && connectionReadyRef.current) {
      sendMessage({
        type: 'unsubscribe',
        jobId
      });
    }
  }, [socket, sendMessage]);

  return {
    socket,
    isConnected,
    connectionState,
    lastMessage,
    sendMessage,
    subscribeToJob,
    unsubscribeFromJob,
    onMessage,
    onProgressUpdate,
    isSubscriptionPending,
    isSubscriptionActive
  };
}
