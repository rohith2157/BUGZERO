import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = 'http://localhost:3000';

/**
 * Hook for WebSocket connection to receive real-time test updates.
 * Falls back gracefully when the server is unavailable.
 */
export function useWebSocket(runId, handlers = {}) {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        if (!runId) return;

        let socket;
        try {
            // Dynamic import to avoid breaking when socket.io-client isn't installed
            import('socket.io-client').then(({ io }) => {
                socket = io(WS_URL, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                });

                socketRef.current = socket;

                socket.on('connect', () => {
                    setConnected(true);
                    socket.emit('test:subscribe', { runId });
                });

                socket.on('disconnect', () => setConnected(false));
                socket.on('test:started', (data) => handlersRef.current.onStarted?.(data));
                socket.on('crawl:complete', (data) => handlersRef.current.onCrawlComplete?.(data));
                socket.on('page:discovered', (data) => handlersRef.current.onPageDiscovered?.(data));
                socket.on('page:complete', (data) => handlersRef.current.onPageComplete?.(data));
                socket.on('defect:found', (data) => handlersRef.current.onDefectFound?.(data));
                socket.on('test:complete', (data) => handlersRef.current.onComplete?.(data));
                socket.on('test:failed', (data) => handlersRef.current.onFailed?.(data));
                socket.on('test:cancelled', (data) => handlersRef.current.onCancelled?.(data));
            }).catch(() => {
                // socket.io-client not installed — ignore
                console.log('WebSocket not available (socket.io-client not installed)');
            });
        } catch {
            // Graceful fallback
        }

        return () => {
            if (socket) {
                socket.emit('test:unsubscribe', { runId });
                socket.disconnect();
            }
        };
    }, [runId]);

    const cancel = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('test:cancel', { runId });
        }
    }, [runId]);

    return { connected, cancel };
}
