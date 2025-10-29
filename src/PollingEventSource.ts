export interface PollingEventSourceOptions {
    interval?: number;
}

export class PollingEventSource {
    private url: string;
    private interval: number;
    private timerId: ReturnType<typeof setTimeout> | null = null;
    public onopen: (() => void) | null = null;
    public onmessage: ((event: { data: unknown }) => void) | null = null;
    public onerror: ((error: Error) => void) | null = null;

    constructor(url: string, options: PollingEventSourceOptions = {}) {
        this.url = url;
        this.interval = options.interval ?? 5000; // Default to 5 seconds

        // Trigger onopen callback immediately when instance is created
        setTimeout(() => {
            if (this.onopen) {
                this.onopen();
            }
            void this.poll();
        }, 0);
    }

    private async poll(): Promise<void> {
        try {
            const response = await fetch(this.url);
            if (response.ok) {
                const data: unknown = await response.json();
                if (this.onmessage) {
                    this.onmessage({ data });
                }
            } else {
                // Handle non-OK HTTP responses
                if (this.onerror) {
                    this.onerror(new Error(`HTTP ${response.status}: ${response.statusText}`));
                }
            }
        } catch (error) {
            if (this.onerror) {
                // Ensure error is an Error instance
                const errorObj = error instanceof Error ? error : new Error(String(error));
                this.onerror(errorObj);
            }
        }

        // Schedule next poll
        this.timerId = setTimeout(() => {
            void this.poll();
        }, this.interval);
    }

    public close(): void {
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
}
