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
        it('should call onopen callback when polling starts', () => {
            const source = new PollingEventSource('https://example.com/api');
            const onopen = jest.fn();
            source.onopen = onopen;

            jest.runAllTimers();

            expect(onopen).toHaveBeenCalledTimes(1);
        });
    });

    describe('polling and onmessage', () => {
        it('should poll the URL and call onmessage with data', async () => {
            const mockData = { message: 'test data' };
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const source = new PollingEventSource('https://example.com/api');
            const onmessage = jest.fn();
            source.onmessage = onmessage;

            // Advance to trigger initial poll
            jest.advanceTimersByTime(0);
            await Promise.resolve();
            await Promise.resolve();

            expect(global.fetch).toHaveBeenCalledWith('https://example.com/api');
            expect(onmessage).toHaveBeenCalledTimes(1);
            expect(onmessage).toHaveBeenCalledWith({ data: mockData });

            source.close();
        });

        it('should poll at regular intervals', async () => {
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

            const source = new PollingEventSource('https://example.com/api', { interval: 1000 });
            const onmessage = jest.fn();
            source.onmessage = onmessage;

            // First poll
            jest.advanceTimersByTime(0);
            await Promise.resolve();
            await Promise.resolve();

            expect(onmessage).toHaveBeenCalledTimes(1);
            expect(onmessage).toHaveBeenCalledWith({ data: mockData1 });

            // Second poll after interval
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
            await Promise.resolve();

            expect(onmessage).toHaveBeenCalledTimes(2);
            expect(onmessage).toHaveBeenCalledWith({ data: mockData2 });

            source.close();
        });
    });

    describe('close', () => {
        it('should stop polling when close is called', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
            });

            const source = new PollingEventSource('https://example.com/api', { interval: 1000 });
            const onmessage = jest.fn();
            source.onmessage = onmessage;

            // First poll
            jest.advanceTimersByTime(0);
            await Promise.resolve();
            await Promise.resolve();

            expect(onmessage).toHaveBeenCalledTimes(1);

            // Close the source
            source.close();

            // Try to trigger next poll
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
            await Promise.resolve();

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

            jest.advanceTimersByTime(0);
            await Promise.resolve();
            await Promise.resolve();

            expect(onerror).toHaveBeenCalledTimes(1);
            expect(onerror).toHaveBeenCalledWith(mockError);

            source.close();
        });
    });
});
