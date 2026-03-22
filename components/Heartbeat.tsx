'use client';

import { useEffect } from 'react';

export default function Heartbeat() {
    useEffect(() => {
        const ping = async () => {
            try {
                await fetch('/api/me/heartbeat', { method: 'POST' });
            } catch (e) {
                // Ignore errors
            }
        };

        // Initial ping
        ping();

        // Ping every 5 minutes
        const interval = setInterval(ping, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return null;
}
