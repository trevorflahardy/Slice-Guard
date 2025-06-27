import { reactive } from 'vue'
import { WebSocketClient } from './ws'
import {
  OpCode,
  type AuthSuccessPayload,
  type AuthFailurePayload,
  type AuthRefreshSuccessPayload,
} from '@shared/ws/opcodes'

const WS_URL = (import.meta as any).env.VITE_WS_URL ?? 'ws://localhost:3000/ws';

const ws = new WebSocketClient(WS_URL);
ws.connect();

export const authState = reactive({
  user: null as any,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
});

ws.addListener(OpCode.AUTH_SUCCESS, (d: AuthSuccessPayload['d']) => {
  authState.user = d.user;
  authState.accessToken = d.accessToken;
  authState.refreshToken = d.refreshToken;
  localStorage.setItem('accessToken', d.accessToken);
  localStorage.setItem('refreshToken', d.refreshToken);
});

ws.addListener(OpCode.AUTH_FAILURE, (d: AuthFailurePayload['d']) => {
  console.warn('Auth failure', d.reason);
});

ws.addListener(OpCode.AUTH_REFRESH_SUCCESS, (d: AuthRefreshSuccessPayload['d']) => {
  authState.accessToken = d.accessToken;
  authState.refreshToken = d.refreshToken;
  localStorage.setItem('accessToken', d.accessToken);
  localStorage.setItem('refreshToken', d.refreshToken);
});

export function login(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
  const onSuccess = (d: AuthSuccessPayload['d']) => {
      ws.removeListener(OpCode.AUTH_SUCCESS, onSuccess);
      ws.removeListener(OpCode.AUTH_FAILURE, onFailure);
      resolve();
    };
  const onFailure = (d: AuthFailurePayload['d']) => {
      ws.removeListener(OpCode.AUTH_SUCCESS, onSuccess);
      ws.removeListener(OpCode.AUTH_FAILURE, onFailure);
      reject(new Error(d.reason));
    };
    ws.addListener(OpCode.AUTH_SUCCESS, onSuccess);
    ws.addListener(OpCode.AUTH_FAILURE, onFailure);
    ws.send(OpCode.AUTH_LOGIN, { email, password });
  });
}

export function tryRefresh(): Promise<void> {
  if (!authState.refreshToken) return Promise.reject();
  return new Promise((resolve, reject) => {
    const onSuccess = (d: AuthRefreshSuccessPayload['d']) => {
      ws.removeListener(OpCode.AUTH_REFRESH_SUCCESS, onSuccess);
      ws.removeListener(OpCode.AUTH_FAILURE, onFailure);
      resolve();
    };
    const onFailure = () => {
      ws.removeListener(OpCode.AUTH_REFRESH_SUCCESS, onSuccess);
      ws.removeListener(OpCode.AUTH_FAILURE, onFailure);
      logout();
      reject(new Error('refresh failed'));
    };
    ws.addListener(OpCode.AUTH_REFRESH_SUCCESS, onSuccess);
    ws.addListener(OpCode.AUTH_FAILURE, onFailure);
    ws.send(OpCode.AUTH_REFRESH, { refreshToken: authState.refreshToken });
  });
}

export function logout() {
  if (authState.refreshToken) {
    ws.send(OpCode.AUTH_LOGOUT, { refreshToken: authState.refreshToken });
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  authState.user = null;
  authState.accessToken = null as any;
  authState.refreshToken = null as any;
}

export { ws };
