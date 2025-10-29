export class PollingEventSource {
    private url: string;
    private isOpen: boolean = false;
    public onopen: (() => void) | null = null;
    public onmessage: ((event: { data: unknown }) => void) | null = null;
    public onerror: ((error: Error) => void) | null = null;

    constructor(url: string) {
        this.url = url;
        this.isOpen = true;

        // Trigger onopen callback immediately when instance is created
        setTimeout(() => {
            if (this.onopen && this.isOpen) {
                this.onopen();
            }
        }, 0);
    }

    public async poll(): Promise<void> {
        if (!this.isOpen) {
            return;
        }

        try {
            const response = await fetch(this.url);
            if (response.ok) {
                const data: unknown = await response.json();
                if (this.onmessage && this.isOpen) {
                    this.onmessage({ data });
                }
            } else {
                // Handle non-OK HTTP responses
                if (this.onerror && this.isOpen) {
                    this.onerror(new Error(`HTTP ${response.status}: ${response.statusText}`));
                }
            }
        } catch (error) {
            if (this.onerror && this.isOpen) {
                // Ensure error is an Error instance
                const errorObj = error instanceof Error ? error : new Error(String(error));
                this.onerror(errorObj);
            }
        }
    }

    public close(): void {
        this.isOpen = false;
    }
}
