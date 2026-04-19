// utils/socket.js
import { io } from 'socket.io-client';

let socket = null;

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:5000';

export const getSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();

  if (!s.connected) {
    // Pass userId in the auth handshake so server middleware can authenticate
    s.auth = { userId };
    s.connect();

    // Ensure join happens AFTER connection
    s.once('connect', () => {
      if (userId) {
        s.emit('user:join', { userId });
      }
    });

    // Handle reconnection - remove old listener first to prevent duplicates
    s.off('reconnect'); // Clean up any existing reconnect listeners
    s.on('reconnect', () => {
      if (userId) {
        s.emit('user:join', { userId });
      }
    });
  } else {
    // If already connected, still ensure user joins
    if (userId) {
      s.emit('user:join', { userId });
    }
  }

  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners(); // clean up listeners
    socket.disconnect();
    socket = null; // reset instance
  }
};