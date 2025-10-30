import { PollingStream } from '../src/index';

describe('index exports', () => {
    it('should export PollingStream', () => {
        expect(PollingStream).toBeDefined();
        const instance = new PollingStream('https://example.com/api');
        expect(instance).toBeInstanceOf(PollingStream);
    });
});
