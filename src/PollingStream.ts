export class PollingStream implements AsyncIterable<unknown> {
    private url: string;
    private signal?: AbortSignal;

    constructor(url: string, signal?: AbortSignal) {
        this.url = url;
        this.signal = signal;
    }

    async *[Symbol.asyncIterator](): AsyncGenerator<unknown, void, void> {
        let lastId: string | null = null;

        while (true) {
            // Check for cancellation before each poll
            if (this.signal?.aborted) {
                return;
            }

            const response = await fetch(this.url, {
                signal: this.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: lastId }),
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
