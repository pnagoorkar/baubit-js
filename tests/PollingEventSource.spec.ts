import { PollingEventSource } from '../src/PollingEventSource';

describe('PollingEventSource', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    describe('constructor', () => {
        it('should create an instance with a URL', () => {
            const source = new PollingEventSource('https://example.com/api');
            expect(source).toBeInstanceOf(PollingEventSource);
        });
    });

    describe('onopen', () => {
        it('should call onopen callback when instance is created', () => {
            const source = new PollingEventSource('https://example.com/api');
            const onopen = jest.fn();
            source.onopen = onopen;

            jest.runAllTimers();

            expect(onopen).toHaveBeenCalledTimes(1);
        });
    });

    describe('poll', () => {
        it('should poll the URL and call onmessage with data when poll() is called', async () => {
            const mockData = { message: 'test data' };
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const source = new PollingEventSource('https://example.com/api');
            const onmessage = jest.fn();
            source.onmessage = onmessage;

            // Caller triggers poll
            await source.poll();

            expect(global.fetch).toHaveBeenCalledWith('https://example.com/api');
            expect(onmessage).toHaveBeenCalledTimes(1);
            expect(onmessage).toHaveBeenCalledWith({ data: mockData });

            source.close();
        });

        it('should allow multiple polls triggered by the caller', async () => {
            const mockData1 = { id: 1 };
            const mockData2 = { id: 2 };
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData1),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData2),
                });

            const source = new PollingEventSource('https://example.com/api');
            const onmessage = jest.fn();
            source.onmessage = onmessage;

            // First poll triggered by caller
            await source.poll();

            expect(onmessage).toHaveBeenCalledTimes(1);
            expect(onmessage).toHaveBeenCalledWith({ data: mockData1 });

            // Second poll triggered by caller after processing first event
            await source.poll();

            expect(onmessage).toHaveBeenCalledTimes(2);
            expect(onmessage).toHaveBeenCalledWith({ data: mockData2 });

            source.close();
        });

        it('should not poll after close is called', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
            });

            const source = new PollingEventSource('https://example.com/api');
            const onmessage = jest.fn();
            source.onmessage = onmessage;

            // First poll
            await source.poll();
            expect(onmessage).toHaveBeenCalledTimes(1);

            // Close the source
            source.close();

            // Try to poll after close
            await source.poll();

            // Should still be 1, not 2
            expect(onmessage).toHaveBeenCalledTimes(1);
        });
    });

    describe('onerror', () => {
        it('should call onerror callback when fetch fails', async () => {
            const mockError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValue(mockError);

            const source = new PollingEventSource('https://example.com/api');
            const onerror = jest.fn();
            source.onerror = onerror;

            await source.poll();

            expect(onerror).toHaveBeenCalledTimes(1);
            expect(onerror).toHaveBeenCalledWith(mockError);

            source.close();
        });

        it('should call onerror callback for non-OK HTTP responses', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });

            const source = new PollingEventSource('https://example.com/api');
            const onerror = jest.fn();
            source.onerror = onerror;

            await source.poll();

            expect(onerror).toHaveBeenCalledTimes(1);
            expect(onerror).toHaveBeenCalledWith(new Error('HTTP 404: Not Found'));

            source.close();
        });

        it('should not call callbacks after close', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
            });

            const source = new PollingEventSource('https://example.com/api');
            const onmessage = jest.fn();
            source.onmessage = onmessage;

            source.close();

            await source.poll();

            expect(onmessage).not.toHaveBeenCalled();
        });
    });
});
