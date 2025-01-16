[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Memory

# Interface: Memory

Represents a stored memory/message

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:456](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L456)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated user ID

#### Defined in

[packages/core/src/types.ts:459](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L459)

***

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated agent ID

#### Defined in

[packages/core/src/types.ts:462](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L462)

***

### createdAt?

> `optional` **createdAt**: `number`

Optional creation timestamp

#### Defined in

[packages/core/src/types.ts:465](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L465)

***

### content

> **content**: [`Content`](Content.md)

Memory content

#### Defined in

[packages/core/src/types.ts:468](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L468)

***

### embedding?

> `optional` **embedding**: `number`[]

Optional embedding vector

#### Defined in

[packages/core/src/types.ts:471](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L471)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated room ID

#### Defined in

[packages/core/src/types.ts:474](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L474)

***

### unique?

> `optional` **unique**: `boolean`

Whether memory is unique

#### Defined in

[packages/core/src/types.ts:477](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L477)

***

### similarity?

> `optional` **similarity**: `number`

Embedding similarity score

#### Defined in

[packages/core/src/types.ts:480](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L480)
