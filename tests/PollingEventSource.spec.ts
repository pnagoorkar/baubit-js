import { PollingStream } from '../src/PollingEventSource';

describe('PollingStream', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should create an instance with a URL', () => {
            const stream = new PollingStream('https://example.com/api');
            expect(stream).toBeInstanceOf(PollingStream);
        });
    });

    describe('poll async iterator', () => {
        it('should yield data from each poll', async () => {
            const mockData1 = { message: 'test data 1' };
            const mockData2 = { message: 'test data 2' };

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData1),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData2),
                });

            const stream = new PollingStream('https://example.com/api');
            const results: unknown[] = [];

            const iterator = stream.poll();

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

            expect(results).toEqual([mockData1, mockData2]);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should work with for-await-of loop', async () => {
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

            const stream = new PollingStream('https://example.com/api');
            const results: unknown[] = [];

            const controller = new AbortController();

            // Use for-await-of to iterate
            let count = 0;
            for await (const data of stream.poll(controller.signal)) {
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
            const mockData = { message: 'test' };
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const stream = new PollingStream('https://example.com/api');
            const controller = new AbortController();
            const results: unknown[] = [];

            const iterator = stream.poll(controller.signal);

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

        it('should throw error for non-OK HTTP responses', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });

            const stream = new PollingStream('https://example.com/api');
            const iterator = stream.poll();

            await expect(iterator.next()).rejects.toThrow('HTTP 404: Not Found');
        });

        it('should throw error when fetch fails', async () => {
            const mockError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValue(mockError);

            const stream = new PollingStream('https://example.com/api');
            const iterator = stream.poll();

            await expect(iterator.next()).rejects.toThrow('Network error');
        });

        it('should pass AbortSignal to fetch', async () => {
            const mockData = { message: 'test' };
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const stream = new PollingStream('https://example.com/api');
            const controller = new AbortController();
            const iterator = stream.poll(controller.signal);

            await iterator.next();

            expect(global.fetch).toHaveBeenCalledWith('https://example.com/api', {
                signal: controller.signal,
            });
        });

        it('should stop immediately when signal is already aborted', async () => {
            const stream = new PollingStream('https://example.com/api');
            const controller = new AbortController();
            controller.abort();

            const iterator = stream.poll(controller.signal);

            const result = await iterator.next();
            expect(result.done).toBe(true);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should work without an AbortSignal', async () => {
            const mockData1 = { message: 'first' };
            const mockData2 = { message: 'second' };

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData1),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockData2),
                });

            const stream = new PollingStream('https://example.com/api');
            const iterator = stream.poll(); // No signal provided

            const result1 = await iterator.next();
            expect(result1.value).toEqual(mockData1);

            const result2 = await iterator.next();
            expect(result2.value).toEqual(mockData2);

            expect(global.fetch).toHaveBeenCalledWith('https://example.com/api', {
                signal: undefined,
            });
        });
    });
});
