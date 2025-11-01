import { WebViewStream } from '../src/index';

describe('index exports', () => {
    it('should export PollingStream', () => {
        expect(WebViewStream).toBeDefined();
        const instance = new WebViewStream('https://example.com/api');
        expect(instance).toBeInstanceOf(WebViewStream);
    });
});
