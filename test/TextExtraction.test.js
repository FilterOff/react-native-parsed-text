import 'jest';
import 'react-native';

import { PATTERNS } from '../src/ParsedText';
import TextExtraction from '../src/lib/TextExtraction';

describe('TextExtraction', () => {
  describe('#parse', () => {
    it('returns an array with the text if there is no patterns', () => {
      const textExtraction = new TextExtraction('Some Text');

      expect(textExtraction.parse()).toMatchInlineSnapshot(`
        Array [
          Object {
            "children": "Some Text",
          },
        ]
      `);
    });

    it('returns an array with the text if the text cant be parsed', () => {
      const textExtraction = new TextExtraction('Some Text', [
        { pattern: /abcdef/ },
      ]);

      expect(textExtraction.parse()).toMatchInlineSnapshot(`
        Array [
          Object {
            "children": "Some Text",
          },
        ]
      `);
    });

    it('returns an array with the text and return only present values', () => {
      const textExtraction = new TextExtraction('abcdef', [
        { pattern: /abcdef/ },
      ]);

      expect(textExtraction.parse()).toEqual([{ children: 'abcdef' }]);
    });

    it('still works even if the RegExp has a previously-used pattern', () => {
      const r = /c/g;
      r.lastIndex = 2;
      const textExtraction = new TextExtraction('cc something c something', [
        { pattern: r, renderText: () => 'Found!' },
      ]);

      expect(textExtraction.parse()).toMatchInlineSnapshot(`
        Array [
          Object {
            "children": "Found!",
          },
          Object {
            "children": "Found!",
          },
          Object {
            "children": " something ",
          },
          Object {
            "children": "Found!",
          },
          Object {
            "children": " something",
          },
        ]
      `);
    });

    it('returns an array with text parts if there is matches', () => {
      const textExtraction = new TextExtraction(
        'hello my website is http://foo.bar, bar is good.',
        [{ pattern: /bar/ }],
      );

      expect(textExtraction.parse()).toMatchInlineSnapshot(`
        Array [
          Object {
            "children": "hello my website is http://foo.",
          },
          Object {
            "children": "bar",
          },
          Object {
            "children": ", ",
          },
          Object {
            "children": "bar",
          },
          Object {
            "children": " is good.",
          },
        ]
      `);
    });

    it('return all matched urls', () => {
      const urls = [
        'https://website.bz',
        'http://website2.it',
        'https://t.co/hashKey',
      ];
      const textExtraction = new TextExtraction(
        `this is my website ${urls[0]} and this is also ${urls[1]} and why not this one also ${urls[2]}`,
        [
          {
            pattern: PATTERNS.url,
          },
        ],
      );

      const parsedText = textExtraction.parse();
      expect(parsedText[1].children).toEqual(urls[0]);
      expect(parsedText[3].children).toEqual(urls[1]);
      expect(parsedText[5].children).toEqual(urls[2]);
    });

    it('return all matched urls with long gTLD', () => {
      const urls = [
        'https://long-gtld.fitness',
        'https://long-gtld.americanexpress',
        'https://long-gtld.xn--vermgensberatung-pwb',
      ];
      const textExtraction = new TextExtraction(
        `this is my website ${urls[0]} and this is also ${urls[1]} and why not this one also ${urls[2]}`,
        [
          {
            pattern: PATTERNS.url,
          },
        ],
      );

      const parsedText = textExtraction.parse();
      expect(parsedText[1].children).toEqual(urls[0]);
      expect(parsedText[3].children).toEqual(urls[1]);
      expect(parsedText[5].children).toEqual(urls[2]);
    });

    it('does not include trailing dots or unexpected punctuation', () => {
      const urls = [
        'https://website.bz',
        'http://website2.it',
        'https://t.co/hashKey',
      ];
      const textExtraction = new TextExtraction(
        `URLS: ${urls[0]}. ${urls[1]}, ${urls[2]}!`,
        [
          {
            pattern: PATTERNS.url,
          },
        ],
      );

      const parsedText = textExtraction.parse();
      expect(parsedText[1].children).toEqual(urls[0]);
      expect(parsedText[3].children).toEqual(urls[1]);
      expect(parsedText[5].children).toEqual(urls[2]);
    });

    it('pass the values to the callbacks', (done) => {
      const textExtraction = new TextExtraction('hello foo', [
        {
          pattern: /foo/,
          onPress: (value) => {
            expect(value).toEqual('foo');
            done();
          },
        },
      ]);

      const parsedText = textExtraction.parse();

      expect(parsedText[0]).toEqual({ children: 'hello ' });
      expect(parsedText[1].children).toEqual('foo');
      expect(parsedText[1].onPress).toBeInstanceOf(Function);

      parsedText[1].onPress(parsedText[1].children);
    });

    it('only allow a text to be parsed once', () => {
      const textExtraction = new TextExtraction(
        'hello my website is http://foo.bar, bar is good.',
        [
          {
            pattern: /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/,
          },
          { pattern: /bar/ },
        ],
      );

      expect(textExtraction.parse()).toMatchInlineSnapshot(`
        Array [
          Object {
            "children": "hello my website is ",
          },
          Object {
            "children": "http://foo.bar",
          },
          Object {
            "children": ", ",
          },
          Object {
            "children": "bar",
          },
          Object {
            "children": " is good.",
          },
        ]
      `);
    });

    it('handles global flagged regexps consistently', () => {
      const lol = 'lol lol lol lol lol lol lol lol';
      // The way this library is constructed, matches progressively consume
      const extractGlobal = new TextExtraction(lol, [
        { pattern: new RegExp('lol', 'gi') },
      ]);
      expect(extractGlobal.parse()).toMatchInlineSnapshot(`
        Array [
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
        ]
      `);

      const extractNonGlobal = new TextExtraction(lol, [
        { pattern: new RegExp('lol', 'i') },
      ]);
      expect(extractNonGlobal.parse()).toMatchInlineSnapshot(`
        Array [
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
          Object {
            "children": " ",
          },
          Object {
            "children": "lol",
          },
        ]
      `);
    });

    it('respects the parsing order', () => {
      const textExtraction = new TextExtraction(
        'hello my website is http://foo.bar, bar is good.',
        [
          { pattern: /bar/ },
          {
            pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
          },
        ],
      );

      expect(textExtraction.parse()).toMatchInlineSnapshot(`
        Array [
          Object {
            "children": "hello my website is http://foo.",
          },
          Object {
            "children": "bar",
          },
          Object {
            "children": ", ",
          },
          Object {
            "children": "bar",
          },
          Object {
            "children": " is good.",
          },
        ]
      `);
    });
  });

  describe('renderText prop', () => {
    it('checks that renderText is a function', (done) => {
      const textExtraction = new TextExtraction('Mention [@michel:561316513]', [
        { pattern: /\[(@[^:]+):([^\]]+)\]/i, renderText: 'foo' },
      ]);

      const parsedText = textExtraction.parse();

      expect(parsedText[0]).toEqual({ children: 'Mention ' });
      expect(parsedText[1]).toEqual({ children: '[@michel:561316513]' });

      done();
    });
    it('pass the values to the callbacks', (done) => {
      const textExtraction = new TextExtraction('Mention [@michel:561316513]', [
        {
          pattern: /\[(@[^:]+):([^\]]+)\]/i,
          renderText: (string, matches) => {
            let pattern = /\[(@[^:]+):([^\]]+)\]/i;
            let match = string.match(pattern);
            expect(matches[0]).toEqual('[@michel:561316513]');
            expect(matches[1]).toEqual('@michel');
            expect(matches[2]).toEqual('561316513');
            return `^^${match[1]}^^`;
          },
        },
      ]);

      const parsedText = textExtraction.parse();

      expect(parsedText[0]).toEqual({ children: 'Mention ' });
      expect(parsedText[1].children).toEqual('^^@michel^^');

      done();
    });
  });
});
