import { PollingEventSource } from '../src/index';

describe('index exports', () => {
    it('should export PollingEventSource', () => {
        expect(PollingEventSource).toBeDefined();
        const instance = new PollingEventSource('https://example.com/api');
        expect(instance).toBeInstanceOf(PollingEventSource);
    });
});
