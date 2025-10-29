import { hello, PollingEventSource } from '../src/index';

describe('hello', () => {
    it('should return "hello world"', () => {
        expect(hello()).toBe('hello world');
    });
});

describe('index exports', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should export PollingEventSource', () => {
        expect(PollingEventSource).toBeDefined();
        const instance = new PollingEventSource('https://example.com/api');
        expect(instance).toBeInstanceOf(PollingEventSource);
        instance.close();
    });
});
