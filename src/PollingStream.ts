interface InitResponse {
    id: string;
    heartbeatInterval: number;
}

export class PollingStream implements AsyncIterable<unknown> {
    private url: string;
    private signal?: AbortSignal;
    private instanceId: string | null = null;
    private heartbeatInterval: number | null = null;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private initPromise: Promise<void>;

    constructor(url: string, signal?: AbortSignal) {
        this.url = url;
        this.signal = signal;
        this.initPromise = this.initialize();
    }

    private async initialize(): Promise<void> {
        // If already aborted, skip initialization
        if (this.signal?.aborted) {
            return;
        }

        try {
            // Make GET call to new/url to get instance id and heartbeat interval
            const response = await fetch(`${this.url}/new`, {
                signal: this.signal,
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = (await response.json()) as InitResponse;
            this.instanceId = data.id;
            this.heartbeatInterval = data.heartbeatInterval;

            // Start heartbeat timer
            if (this.heartbeatInterval && !this.signal?.aborted) {
                this.startHeartbeat();
            }

            // Stop heartbeat when signal is aborted
            if (this.signal) {
                this.signal.addEventListener('abort', () => {
                    this.stopHeartbeat();
                });
            }
        } catch (error) {
            // If already aborted, don't throw
            if (this.signal?.aborted) {
                return;
            }
            throw error;
        }
    }

    private startHeartbeat(): void {
        if (!this.heartbeatInterval) {
            return;
        }

        this.heartbeatTimer = setInterval(() => {
            void this.sendHeartbeat();
        }, this.heartbeatInterval);
    }

    private async sendHeartbeat(): Promise<void> {
        if (this.signal?.aborted) {
            this.stopHeartbeat();
            return;
        }

        try {
            await fetch(`${this.url}/heartbeat`, {
                signal: this.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: this.instanceId }),
            });
        } catch {
            // Ignore heartbeat errors
        }
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    async *[Symbol.asyncIterator](): AsyncGenerator<unknown, void, void> {
        // Wait for initialization to complete
        await this.initPromise;

        let lastId: string | null = null;

        while (this.signal?.aborted === false) {
            const response = await fetch(this.url, {
                signal: this.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: lastId, instanceId: this.instanceId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: unknown = await response.json();

            // Extract id from response if it exists
            if (data && typeof data === 'object' && 'id' in data) {
                lastId = String((data as { id: unknown }).id);
            }

            yield data;
        }
    }
}
