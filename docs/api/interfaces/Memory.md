[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Memory

# Interface: Memory

Represents a stored memory/message

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:352](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L352)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated user ID

#### Defined in

[packages/core/src/types.ts:355](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L355)

***

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated agent ID

#### Defined in

[packages/core/src/types.ts:358](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L358)

***

### createdAt?

> `optional` **createdAt**: `number`

Optional creation timestamp

#### Defined in

[packages/core/src/types.ts:361](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L361)

***

### content

> **content**: [`Content`](Content.md)

Memory content

#### Defined in

[packages/core/src/types.ts:364](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L364)

***

### embedding?

> `optional` **embedding**: `number`[]

Optional embedding vector

#### Defined in

[packages/core/src/types.ts:367](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L367)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated room ID

#### Defined in

[packages/core/src/types.ts:370](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L370)

***

### unique?

> `optional` **unique**: `boolean`

Whether memory is unique

#### Defined in

[packages/core/src/types.ts:373](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L373)

***

### similarity?

> `optional` **similarity**: `number`

Embedding similarity score

#### Defined in

[packages/core/src/types.ts:376](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L376)
