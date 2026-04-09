import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { GATEWAY_BASE } from '../api/apiClient';
import * as SecureStore from 'expo-secure-store';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const subscriptions = useRef({});

  useEffect(() => {
    const connect = async () => {
      const token = await SecureStore.getItemAsync('jwt_token');
      const client = new Client({
        webSocketFactory: () => new SockJS(`${GATEWAY_BASE}/ws`),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 5000,
        onConnect: () => {
          setConnected(true);
          console.log('STOMP connected');
        },
        onDisconnect: () => {
          setConnected(false);
          console.log('STOMP disconnected');
        },
        onStompError: (frame) => {
          console.error('STOMP error', frame);
        },
      });
      client.activate();
      clientRef.current = client;
    };

    connect();

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  const subscribe = (topic, callback) => {
    if (!clientRef.current || !connected) return null;
    if (subscriptions.current[topic]) {
      subscriptions.current[topic].unsubscribe();
    }
    const sub = clientRef.current.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (e) {
        callback(message.body);
      }
    });
    subscriptions.current[topic] = sub;
    return sub;
  };

  const unsubscribe = (topic) => {
    if (subscriptions.current[topic]) {
      subscriptions.current[topic].unsubscribe();
      delete subscriptions.current[topic];
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, subscribe, unsubscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
