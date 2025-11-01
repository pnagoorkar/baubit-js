import { WebViewStream } from '../src/WebViewStream';

describe('WebViewStream', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    const mockInitResponse = (id = 'instance-123', heartbeatInterval = 5000) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id, heartbeatInterval }),
        });
    };

    describe('constructor', () => {
        it('should create an instance with a URL', () => {
            mockInitResponse();
            const stream = new WebViewStream('https://example.com/api');
            expect(stream).toBeInstanceOf(WebViewStream);
        });

        it('should create an instance with a URL and AbortSignal', () => {
            mockInitResponse();
            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);
            expect(stream).toBeInstanceOf(WebViewStream);
        });

        it('should call /new endpoint during initialization', async () => {
            mockInitResponse('test-id', 1000);
            const stream = new WebViewStream('https://example.com/api');

            // Access the iterator to trigger initialization
            const iterator = stream[Symbol.asyncIterator]();
            await iterator.next();

            expect(global.fetch).toHaveBeenCalledWith('https://example.com/api/new', {
                signal: undefined,
                method: 'GET',
            });
        });
    });

    describe('async iterator', () => {
        it('should yield data from each poll', async () => {
            const mockData1 = { id: 'id1', message: 'test data 1' };
            const mockData2 = { id: 'id2', message: 'test data 2' };

            mockInitResponse('inst-1', 5000);
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData1),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData2),
                });

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);
            const results: unknown[] = [];

            const iterator = stream[Symbol.asyncIterator]();

            // Get first result
            const result1 = await iterator.next();
            expect(result1.done).toBe(false);
            expect(result1.value).toEqual(mockData1);
            results.push(result1.value);

            // Get second result
            const result2 = await iterator.next();
            expect(result2.done).toBe(false);
            expect(result2.value).toEqual(mockData2);
            results.push(result2.value);

            controller.abort();

            expect(results).toEqual([mockData1, mockData2]);
            expect(global.fetch).toHaveBeenCalledTimes(3); // init + 2 polls
        });

        it('should work with for-await-of loop', async () => {
            const mockData1 = { id: 'id1' };
            const mockData2 = { id: 'id2' };

            mockInitResponse('inst-2', 5000);
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData1),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData2),
                });

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);
            const results: unknown[] = [];

            // Use for-await-of to iterate
            let count = 0;
            for await (const data of stream) {
                results.push(data);
                count++;

                // Stop after 2 iterations
                if (count >= 2) {
                    controller.abort();
                }
            }

            expect(results).toEqual([mockData1, mockData2]);
        });

        it('should stop polling when AbortSignal is triggered', async () => {
            const mockData = { id: 'id1', message: 'test' };
            mockInitResponse('inst-3', 5000);
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);
            const results: unknown[] = [];

            const iterator = stream[Symbol.asyncIterator]();

            // Get first result
            const result1 = await iterator.next();
            expect(result1.done).toBe(false);
            results.push(result1.value);

            // Abort before next poll
            controller.abort();

            // Try to get next result - should be done
            const result2 = await iterator.next();
            expect(result2.done).toBe(true);

            expect(results.length).toBe(1);
        });

        it('should throw error for non-OK HTTP responses during init', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });

            const stream = new WebViewStream('https://example.com/api');
            const iterator = stream[Symbol.asyncIterator]();

            await expect(iterator.next()).rejects.toThrow('HTTP 404: Not Found');
        });

        it('should throw error when fetch fails during init', async () => {
            const mockError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValue(mockError);

            const stream = new WebViewStream('https://example.com/api');
            const iterator = stream[Symbol.asyncIterator]();

            await expect(iterator.next()).rejects.toThrow('Network error');
        });

        it('should send null id and instanceId in first request', async () => {
            const mockData = { id: 'id1', message: 'test' };
            mockInitResponse('inst-4', 5000);
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);
            const iterator = stream[Symbol.asyncIterator]();

            await iterator.next();
            controller.abort();

            expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://example.com/api', {
                signal: controller.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ instanceId: 'inst-4' }),
            });
        });

        it('should send previous id in subsequent requests', async () => {
            const mockData1 = { id: 'id1', message: 'first' };
            const mockData2 = { id: 'id2', message: 'second' };

            mockInitResponse('inst-5', 5000);
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData1),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData2),
                });

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);
            const iterator = stream[Symbol.asyncIterator]();

            await iterator.next();
            await iterator.next();
            controller.abort();

            // First data poll with null id
            expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://example.com/api', {
                signal: controller.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ instanceId: 'inst-5' }),
            });

            // Second data poll with id from first response
            expect(global.fetch).toHaveBeenNthCalledWith(3, 'https://example.com/api', {
                signal: controller.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ instanceId: 'inst-5' }),
            });
        });

        it('should stop immediately when signal is already aborted', async () => {
            const controller = new AbortController();
            controller.abort();

            const stream = new WebViewStream('https://example.com/api', controller.signal);
            const iterator = stream[Symbol.asyncIterator]();

            const result = await iterator.next();
            expect(result.done).toBe(true);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should pass AbortSignal to fetch', async () => {
            const mockData = { id: 'id1', message: 'test' };
            mockInitResponse('inst-6', 5000);
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);
            const iterator = stream[Symbol.asyncIterator]();

            await iterator.next();
            controller.abort();

            expect(global.fetch).toHaveBeenCalledWith('https://example.com/api', {
                signal: controller.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ instanceId: 'inst-6' }),
            });
        });
    });

    describe('heartbeat', () => {
        it('should start heartbeat timer after initialization', async () => {
            mockInitResponse('inst-7', 1000);
            const mockHeartbeatResponse = {
                ok: true,
                json: () => Promise.resolve({}),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockHeartbeatResponse);

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);

            // Wait for initialization
            const iterator = stream[Symbol.asyncIterator]();
            await iterator.next();

            // Advance timer by heartbeat interval
            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            // Should have called init + data poll + heartbeat
            expect(global.fetch).toHaveBeenCalledWith('https://example.com/api/heartbeat', {
                signal: controller.signal,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: 'inst-7' }),
            });

            controller.abort();
        });

        it('should stop heartbeat when signal is aborted', async () => {
            mockInitResponse('inst-8', 1000);
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);

            // Wait for initialization
            const iterator = stream[Symbol.asyncIterator]();
            await iterator.next();

            // Abort the signal
            controller.abort();

            // Clear previous call counts
            const callCountBeforeAbort = (global.fetch as jest.Mock).mock.calls.length;

            // Advance timer - should not make more heartbeat calls
            jest.advanceTimersByTime(5000);
            await Promise.resolve();

            expect((global.fetch as jest.Mock).mock.calls.length).toBe(callCountBeforeAbort);
        });

        it('should handle heartbeat errors gracefully', async () => {
            mockInitResponse('inst-9', 500);
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'data1' }),
                })
                .mockRejectedValueOnce(new Error('Heartbeat failed'));

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);

            // Wait for initialization
            const iterator = stream[Symbol.asyncIterator]();
            await iterator.next();

            // Advance timer to trigger heartbeat
            jest.advanceTimersByTime(500);
            await Promise.resolve();
            await Promise.resolve();

            // Should not throw - heartbeat errors are ignored
            controller.abort();
        });

        it('should not start heartbeat if no interval provided', async () => {
            mockInitResponse('inst-10', 0);
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ id: 'data1' }),
            });

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);

            // Wait for initialization
            const iterator = stream[Symbol.asyncIterator]();
            await iterator.next();

            // Advance timer
            jest.advanceTimersByTime(5000);
            await Promise.resolve();

            // Should only have init call + data poll, no heartbeat
            const heartbeatCalls = (global.fetch as jest.Mock).mock.calls.filter(
                (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('/heartbeat')
            );
            expect(heartbeatCalls.length).toBe(0);

            controller.abort();
        });
    });

    describe('error handling', () => {
        it('should throw error for non-OK response during data poll', async () => {
            mockInitResponse('inst-11', 5000);
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            const controller = new AbortController();
            const stream = new WebViewStream('https://example.com/api', controller.signal);
            const iterator = stream[Symbol.asyncIterator]();

            await expect(iterator.next()).rejects.toThrow('HTTP 500: Internal Server Error');
            controller.abort();
        });
    });
});
