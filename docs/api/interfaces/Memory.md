[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Memory

# Interface: Memory

Represents a stored memory/message

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:422](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L422)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated user ID

#### Defined in

[packages/core/src/types.ts:425](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L425)

***

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated agent ID

#### Defined in

[packages/core/src/types.ts:428](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L428)

***

### createdAt?

> `optional` **createdAt**: `number`

Optional creation timestamp

#### Defined in

[packages/core/src/types.ts:431](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L431)

***

### content

> **content**: [`Content`](Content.md)

Memory content

#### Defined in

[packages/core/src/types.ts:434](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L434)

***

### embedding?

> `optional` **embedding**: `number`[]

Optional embedding vector

#### Defined in

[packages/core/src/types.ts:437](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L437)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Associated room ID

#### Defined in

[packages/core/src/types.ts:440](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L440)

***

### unique?

> `optional` **unique**: `boolean`

Whether memory is unique

#### Defined in

[packages/core/src/types.ts:443](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L443)

***

### similarity?

> `optional` **similarity**: `number`

Embedding similarity score

#### Defined in

[packages/core/src/types.ts:446](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L446)
