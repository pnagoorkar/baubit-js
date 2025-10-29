import { hello } from '../src/index';

describe('hello', () => {
    it('should return "hello world"', () => {
        expect(hello()).toBe('hello world');
    });
});
