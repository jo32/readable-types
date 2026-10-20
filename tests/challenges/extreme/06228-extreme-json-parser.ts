// https://github.com/type-challenges/type-challenges/blob/main/questions/06228-extreme-json-parser/README.md
// Pure, SetProperty, Token, ParseResult, Tokenize, ParseLiteral and Parse come from the template.

type Pure<T> = {
  [P in keyof T]: T[P] extends object ? Pure<T[P]> : T[P];
};

type SetProperty<T, K extends PropertyKey, V> = {
  [P in (keyof T) | K]: P extends K ? V : P extends keyof T ? T[P] : never;
};

// Punctuation, keyword literals, and strings wrapped in a 1-tuple so they can't pass for punctuation.
type Token = "{" | "}" | "[" | "]" | ":" | "," | true | false | null | [string];
type ParseResult<T, K extends Token[]> = [T, K];

type Whitespace = " " | "\n" | "\r" | "\t";
type Punctuation = "{" | "}" | "[" | "]" | ":" | ",";
type Escapes = { n: "\n"; r: "\r"; t: "\t"; b: "\b"; f: "\f"; '"': '"'; "\\": "\\"; "/": "/" };

// The rest of a string literal after its opening quote: [decoded, rest], or never.
type ReadString<T extends string, Acc extends string = ""> =
  T extends `"${infer Rest}` ? [Acc, Rest]
    : T extends `\\${infer Escape}${infer Rest}`
      ? Escape extends keyof Escapes ? ReadString<Rest, `${Acc}${Escapes[Escape]}`> : never // \u is not supported
      : T extends `${infer C}${infer Rest}`
        ? C extends "\n" | "\r" ? never : ReadString<Rest, `${Acc}${C}`>
        : never; // unterminated

// Numbers are out of scope (see the README), so they fail like any other unexpected input.
type Tokenize<T extends string, S extends Token[] = []> =
  T extends `${Whitespace}${infer Rest}` ? Tokenize<Rest, S>
    : T extends `${infer P extends Punctuation}${infer Rest}` ? Tokenize<Rest, [...S, P]>
      : T extends `true${infer Rest}` ? Tokenize<Rest, [...S, true]>
        : T extends `false${infer Rest}` ? Tokenize<Rest, [...S, false]>
          : T extends `null${infer Rest}` ? Tokenize<Rest, [...S, null]>
            : T extends `"${infer Rest}`
              ? ReadString<Rest> extends [infer Text extends string, infer After extends string]
                ? Tokenize<After, [...S, [Text]]>
                : never
              : T extends "" ? S : never;

type ParseArray<T extends Token[], Acc extends unknown[] = []> =
  ParseLiteral<T> extends infer Result
    ? Result extends [infer Value, infer Rest extends Token[]]
      ? Rest extends [",", ...infer Next extends Token[]] ? ParseArray<Next, [...Acc, Value]>
        : Rest extends ["]", ...infer Next extends Token[]] ? ParseResult<[...Acc, Value], Next>
          : never
      : never
    : never;

type ParseObject<T extends Token[], Acc = {}> =
  T extends [[infer Key extends string], ":", ...infer ValueTokens extends Token[]]
    ? ParseLiteral<ValueTokens> extends infer Result
      ? Result extends [infer Value, infer Rest extends Token[]]
        ? Rest extends [",", ...infer Next extends Token[]] ? ParseObject<Next, SetProperty<Acc, Key, Value>>
          : Rest extends ["}", ...infer Next extends Token[]] ? ParseResult<SetProperty<Acc, Key, Value>, Next>
            : never
        : never
      : never
    : never; // keys must be strings

type ParseLiteral<T extends Token[]> =
  T extends [infer First, ...infer Rest extends Token[]]
    ? First extends true | false | null ? ParseResult<First, Rest>
      : First extends [infer Text extends string] ? ParseResult<Text, Rest>
        : First extends "["
          ? Rest extends ["]", ...infer Next extends Token[]] ? ParseResult<[], Next> : ParseArray<Rest>
          : First extends "{"
            ? Rest extends ["}", ...infer Next extends Token[]] ? ParseResult<{}, Next> : ParseObject<Rest>
            : never
    : never;

// The whole input must be exactly one value.
type Parse<T extends string> =
  ParseLiteral<Tokenize<T>> extends infer Result ? Result extends [infer Value, []] ? Pure<Value> : never : never;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<(
    Parse<`
      {
        "a": "b", 
        "b": false, 
        "c": [true, false, "hello", {
          "a": "b", 
          "b": false
        }], 
        "nil": null
      }
    `>
  ), (
    {
      nil: null
      c: [true, false, 'hello', {
        a: 'b'
        b: false
      }]
      b: false
      a: 'b'
    }

  )>>,
  Expect<Equal<Parse<'{}'>, {}>>,

  Expect<Equal<Parse<'[]'>, []>>,

  Expect<Equal<Parse<'[1]'>, never>>,

  Expect<Equal<Parse<'true'>, true>>,

  Expect<Equal<
  Parse<'["Hello", true, false, null]'>,
  ['Hello', true, false, null]
  >>,

  Expect<Equal<
  (
    Parse<`
      {
        "hello\\r\\n\\b\\f": "world"
      }`>
  ), (
    {
      'hello\r\n\b\f': 'world'
    }
  )
  >>,

  Expect<Equal<Parse<'{ 1: "world" }'>, never>>,

  Expect<Equal<Parse<`{ "hello
  
  world": 123 }`>, never>>,
]
