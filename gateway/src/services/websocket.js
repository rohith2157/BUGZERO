// WebSocket event handling for real-time test progress

export function setupWebSocket(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Client subscribes to a specific test run
        socket.on('test:subscribe', (data) => {
            const { runId } = data;
            if (runId) {
                socket.join(`test:${runId}`);
                console.log(`📡 ${socket.id} subscribed to test:${runId}`);
            }
        });

        // Client unsubscribes from a test run
        socket.on('test:unsubscribe', (data) => {
            const { runId } = data;
            if (runId) {
                socket.leave(`test:${runId}`);
            }
        });

        // Client requests test cancellation
        socket.on('test:cancel', (data) => {
            const { runId } = data;
            console.log(`⏹️ Cancel requested for test:${runId}`);
            // Forward to AI Core via HTTP (handled in testService)
            io.to(`test:${runId}`).emit('test:cancelling', { runId });
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
}

// Helper to emit test events from the service layer
export function emitTestEvent(io, runId, event, data) {
    io.to(`test:${runId}`).emit(event, { runId, ...data });
}
