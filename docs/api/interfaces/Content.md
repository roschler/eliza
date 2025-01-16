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

[packages/core/src/types.ts:80](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L80)

***

### action?

> `optional` **action**: `string`

Optional action associated with the message

#### Defined in

[packages/core/src/types.ts:83](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L83)

***

### source?

> `optional` **source**: `string`

Optional source/origin of the content

#### Defined in

[packages/core/src/types.ts:86](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L86)

***

### url?

> `optional` **url**: `string`

URL of the original message/post (e.g. tweet URL, Discord message link)

#### Defined in

[packages/core/src/types.ts:89](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L89)

***

### inReplyTo?

> `optional` **inReplyTo**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

UUID of parent message if this is a reply/thread

#### Defined in

[packages/core/src/types.ts:92](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L92)

***

### attachments?

> `optional` **attachments**: [`Media`](../type-aliases/Media.md)[]

Array of media attachments

#### Defined in

[packages/core/src/types.ts:95](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L95)
