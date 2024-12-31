[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Memory

# Interface: Memory

Represents a stored memory/message

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:344](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L344)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated user ID

#### Defined in

[packages/core/src/types.ts:347](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L347)

***

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated agent ID

#### Defined in

[packages/core/src/types.ts:350](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L350)

***

### createdAt?

> `optional` **createdAt**: `number`

Optional creation timestamp

#### Defined in

[packages/core/src/types.ts:353](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L353)

***

### content

> **content**: [`Content`](Content.md)

Memory content

#### Defined in

[packages/core/src/types.ts:356](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L356)

***

### embedding?

> `optional` **embedding**: `number`[]

Optional embedding vector

#### Defined in

[packages/core/src/types.ts:359](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L359)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated room ID

#### Defined in

[packages/core/src/types.ts:362](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L362)

***

### unique?

> `optional` **unique**: `boolean`

Whether memory is unique

#### Defined in

[packages/core/src/types.ts:365](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L365)

***

### similarity?

> `optional` **similarity**: `number`

Embedding similarity score

#### Defined in

[packages/core/src/types.ts:368](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L368)
