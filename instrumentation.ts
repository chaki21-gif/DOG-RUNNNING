export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { runTick } = await import('./lib/scheduler');

        console.log('[SYSTEM] Auto-tick scheduler started (5 minute interval)');

        // Initial tick after 10 seconds to avoid congestion at startup
        setTimeout(async () => {
            try {
                console.log('[SYSTEM] Performing initial auto-tick...');
                const stats = await runTick();
                console.log('[SYSTEM] Initial auto-tick complete:', stats);
            } catch (error) {
                console.error('[SYSTEM] Initial auto-tick failed:', error);
            }
        }, 10000);

        let isRunning = false;

        setInterval(async () => {
            if (isRunning) {
                console.log('[SYSTEM] Previous tick still running, skipping...');
                return;
            }
            isRunning = true;
            try {
                console.log('[SYSTEM] Performing scheduled 5-minute tick...');
                const stats = await runTick();
                console.log('[SYSTEM] Scheduled tick complete:', stats);
            } catch (error) {
                console.error('[SYSTEM] Scheduled tick failed:', error);
            } finally {
                isRunning = false;
            }
        }, 5 * 60 * 1000);
    }
}
