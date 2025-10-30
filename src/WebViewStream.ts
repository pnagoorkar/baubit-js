/**
 * Response structure from the initialization endpoint.
 * @internal
 */
interface InitResponse {
    /** Unique identifier for this stream instance */
    id: string;
    /** Interval in milliseconds for heartbeat polling */
    heartbeatInterval: number;
}

/**
 * WebViewStream provides an EventSource-like interface for MAUI WebView environments
 * where keep-alive streams are not supported when intercepting WebResource requests.
 *
 * This class implements AsyncIterable, allowing consumption of server-sent events
 * through async iteration patterns while maintaining session health via heartbeat.
 *
 * @example
 * ```typescript
 * const controller = new AbortController();
 * const stream = new WebViewStream('https://api.example.com/events', controller.signal);
 *
 * try {
 *   for await (const event of stream) {
 *     console.log('Received event:', event);
 *     // Process event...
 *   }
 * } catch (error) {
 *   console.error('Stream error:', error);
 * } finally {
 *   controller.abort(); // Clean up
 * }
 * ```
 */
export class WebViewStream implements AsyncIterable<unknown> {
    private url: string;
    private signal?: AbortSignal;
    private instanceId: string | null = null;
    private heartbeatInterval: number | null = null;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private initPromise: Promise<void>;

    /**
     * Creates a new WebViewStream instance.
     *
     * Upon construction, the stream initializes by making a GET request to `{url}/new`
     * to obtain a unique instance ID and heartbeat interval. The heartbeat mechanism
     * automatically starts to maintain session health.
     *
     * @param url - The base URL for the event stream endpoint
     * @param signal - Optional AbortSignal to control stream lifecycle and cancel operations
     *
     * @example
     * ```typescript
     * // Basic usage
     * const stream = new WebViewStream('https://api.example.com/events');
     *
     * // With cancellation support
     * const controller = new AbortController();
     * const stream = new WebViewStream('https://api.example.com/events', controller.signal);
     * // Later: controller.abort() to stop the stream
     * ```
     */
    constructor(url: string, signal?: AbortSignal) {
        this.url = url;
        this.signal = signal;
        this.initPromise = this.initialize();
    }

    /**
     * Initializes the stream by fetching instance ID and heartbeat configuration.
     *
     * Makes a GET request to `{url}/new` to retrieve:
     * - A unique instance ID for this stream session
     * - Heartbeat interval for maintaining session health
     *
     * @private
     * @throws {Error} If the initialization request fails or returns non-OK status
     */
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

    /**
     * Starts the heartbeat timer to maintain session health.
     *
     * Sends periodic heartbeat requests to `{url}/heartbeat` at the interval
     * specified during initialization. Heartbeat automatically stops when the
     * AbortSignal is triggered.
     *
     * @private
     */
    private startHeartbeat(): void {
        if (!this.heartbeatInterval) {
            return;
        }

        this.heartbeatTimer = setInterval(() => {
            void this.sendHeartbeat();
        }, this.heartbeatInterval);
    }

    /**
     * Sends a single heartbeat request to the server.
     *
     * Posts the instance ID to `{url}/heartbeat` to signal that this stream
     * session is still active. Errors are silently ignored to prevent heartbeat
     * failures from disrupting the main event stream.
     *
     * @private
     */
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

    /**
     * Stops the heartbeat timer and cleans up resources.
     *
     * @private
     */
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Async iterator that yields events from the server.
     *
     * This method implements the AsyncIterable protocol, allowing the stream to be
     * consumed with `for await...of` loops. Each iteration polls the server endpoint
     * and yields the received data.
     *
     * The iterator:
     * - Waits for initialization to complete before starting
     * - Continues polling while the AbortSignal is not aborted
     * - Sends the instance ID with each request to maintain session context
     * - Throws errors for non-OK HTTP responses
     *
     * @yields {unknown} Events received from the server
     * @throws {Error} If a request fails or returns non-OK status
     *
     * @example
     * ```typescript
     * const controller = new AbortController();
     * const stream = new WebViewStream('https://api.example.com/events', controller.signal);
     *
     * for await (const event of stream) {
     *   console.log('Event:', event);
     *   // Process event...
     *   // Optionally abort: if (shouldStop) controller.abort();
     * }
     * ```
     */
    async *[Symbol.asyncIterator](): AsyncGenerator<unknown, void, void> {
        // Wait for initialization to complete
        await this.initPromise;

        while (this.signal?.aborted === false) {
            const response = await fetch(this.url, {
                signal: this.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ instanceId: this.instanceId }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: unknown = await response.json();

            yield data;
        }
    }
}
