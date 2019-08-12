/* eslint-disable no-undef */
import * as util from '../src/util';

describe('Util', () => {
    describe('Strings', () => {
        describe('#parseList', () => {
            it('parses a comma separated list of strings', () => {
                const stringList = 'hello,world,again';
                expect(util.Strings.parseList(stringList)).toEqual(['hello', 'world', 'again']);
            });
            it('trims whitespace from strings', () => {
                const stringList = ' hello, wor ld, again  ';
                expect(util.Strings.parseList(stringList)).toEqual(['hello', 'world', 'again']);
            });
            it('parses a string whitout comma as one', () => {
                const stringList = ' hello wor ld again  ';
                expect(util.Strings.parseList(stringList)).toEqual(['helloworldagain']);
            });
            it('returns empty array empty string is passed', () => {
                expect(util.Strings.parseList('')).toEqual([]);
            });
            it('does not return empty strings', () => {
                expect(util.Strings.parseList(',,,,')).toEqual([]);
            });
        });
    });
});
