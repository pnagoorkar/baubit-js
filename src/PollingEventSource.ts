export class PollingStream {
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    async *poll(signal?: AbortSignal): AsyncGenerator<unknown, void, void> {
        while (true) {
            // Check for cancellation before each poll
            if (signal?.aborted) {
                return;
            }

            const response = await fetch(this.url, { signal });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: unknown = await response.json();
            yield data;
        }
    }
}
