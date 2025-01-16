[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Memory

# Interface: Memory

Represents a stored memory/message

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:435](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L435)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated user ID

#### Defined in

[packages/core/src/types.ts:438](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L438)

***

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated agent ID

#### Defined in

[packages/core/src/types.ts:441](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L441)

***

### createdAt?

> `optional` **createdAt**: `number`

Optional creation timestamp

#### Defined in

[packages/core/src/types.ts:444](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L444)

***

### content

> **content**: [`Content`](Content.md)

Memory content

#### Defined in

[packages/core/src/types.ts:447](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L447)

***

### embedding?

> `optional` **embedding**: `number`[]

Optional embedding vector

#### Defined in

[packages/core/src/types.ts:450](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L450)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated room ID

#### Defined in

[packages/core/src/types.ts:453](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L453)

***

### unique?

> `optional` **unique**: `boolean`

Whether memory is unique

#### Defined in

[packages/core/src/types.ts:456](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L456)

***

### similarity?

> `optional` **similarity**: `number`

Embedding similarity score

#### Defined in

[packages/core/src/types.ts:459](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L459)
