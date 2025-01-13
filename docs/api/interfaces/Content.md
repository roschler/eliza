[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Content

# Interface: Content

Represents the content of a message or communication

## Indexable

 \[`key`: `string`\]: `unknown`

## Properties

### text

> **text**: `string`

The main text content

#### Defined in

[packages/core/src/types.ts:49](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L49)

***

### action?

> `optional` **action**: `string`

Optional action associated with the message

#### Defined in

[packages/core/src/types.ts:52](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L52)

***

### source?

> `optional` **source**: `string`

Optional source/origin of the content

#### Defined in

[packages/core/src/types.ts:55](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L55)

***

### url?

> `optional` **url**: `string`

URL of the original message/post (e.g. tweet URL, Discord message link)

#### Defined in

[packages/core/src/types.ts:58](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L58)

***

### inReplyTo?

> `optional` **inReplyTo**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

UUID of parent message if this is a reply/thread

#### Defined in

[packages/core/src/types.ts:61](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L61)

***

### attachments?

> `optional` **attachments**: [`Media`](../type-aliases/Media.md)[]

Array of media attachments

#### Defined in

[packages/core/src/types.ts:64](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L64)
