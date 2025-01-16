[@ai16z/eliza v0.1.5-alpha.5](../index.md) / State

# Interface: State

Represents the current state/context of a conversation

## Indexable

 \[`key`: `string`\]: `unknown`

## Properties

### userId?

> `optional` **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

ID of user who sent current message

#### Defined in

[packages/core/src/types.ts:356](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L356)

***

### agentId?

> `optional` **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

ID of agent in conversation

#### Defined in

[packages/core/src/types.ts:359](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L359)

***

### bio

> **bio**: `string`

Agent's biography

#### Defined in

[packages/core/src/types.ts:362](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L362)

***

### lore

> **lore**: `string`

Agent's background lore

#### Defined in

[packages/core/src/types.ts:365](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L365)

***

### messageDirections

> **messageDirections**: `string`

Message handling directions

#### Defined in

[packages/core/src/types.ts:368](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L368)

***

### postDirections

> **postDirections**: `string`

Post handling directions

#### Defined in

[packages/core/src/types.ts:371](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L371)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Current room/conversation ID

#### Defined in

[packages/core/src/types.ts:374](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L374)

***

### agentName?

> `optional` **agentName**: `string`

Optional agent name

#### Defined in

[packages/core/src/types.ts:377](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L377)

***

### senderName?

> `optional` **senderName**: `string`

Optional message sender name

#### Defined in

[packages/core/src/types.ts:380](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L380)

***

### actors

> **actors**: `string`

String representation of conversation actors

#### Defined in

[packages/core/src/types.ts:383](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L383)

***

### actorsData?

> `optional` **actorsData**: [`Actor`](Actor.md)[]

Optional array of actor objects

#### Defined in

[packages/core/src/types.ts:386](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L386)

***

### goals?

> `optional` **goals**: `string`

Optional string representation of goals

#### Defined in

[packages/core/src/types.ts:389](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L389)

***

### goalsData?

> `optional` **goalsData**: [`Goal`](Goal.md)[]

Optional array of goal objects

#### Defined in

[packages/core/src/types.ts:392](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L392)

***

### recentMessages

> **recentMessages**: `string`

Recent message history as string

#### Defined in

[packages/core/src/types.ts:395](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L395)

***

### recentMessagesData

> **recentMessagesData**: [`Memory`](Memory.md)[]

Recent message objects

#### Defined in

[packages/core/src/types.ts:398](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L398)

***

### actionNames?

> `optional` **actionNames**: `string`

Optional valid action names

#### Defined in

[packages/core/src/types.ts:401](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L401)

***

### actions?

> `optional` **actions**: `string`

Optional action descriptions

#### Defined in

[packages/core/src/types.ts:404](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L404)

***

### actionsData?

> `optional` **actionsData**: [`Action`](Action.md)[]

Optional action objects

#### Defined in

[packages/core/src/types.ts:407](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L407)

***

### actionExamples?

> `optional` **actionExamples**: `string`

Optional action examples

#### Defined in

[packages/core/src/types.ts:410](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L410)

***

### providers?

> `optional` **providers**: `string`

Optional provider descriptions

#### Defined in

[packages/core/src/types.ts:413](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L413)

***

### responseData?

> `optional` **responseData**: [`Content`](Content.md)

Optional response content

#### Defined in

[packages/core/src/types.ts:416](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L416)

***

### recentInteractionsData?

> `optional` **recentInteractionsData**: [`Memory`](Memory.md)[]

Optional recent interaction objects

#### Defined in

[packages/core/src/types.ts:419](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L419)

***

### recentInteractions?

> `optional` **recentInteractions**: `string`

Optional recent interactions string

#### Defined in

[packages/core/src/types.ts:422](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L422)

***

### formattedConversation?

> `optional` **formattedConversation**: `string`

Optional formatted conversation

#### Defined in

[packages/core/src/types.ts:425](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L425)

***

### knowledge?

> `optional` **knowledge**: `string`

Optional formatted knowledge

#### Defined in

[packages/core/src/types.ts:428](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L428)

***

### knowledgeData?

> `optional` **knowledgeData**: [`KnowledgeItem`](../type-aliases/KnowledgeItem.md)[]

Optional knowledge data

#### Defined in

[packages/core/src/types.ts:430](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L430)

***

### simpleQuestion?

> `optional` **simpleQuestion**: `string`

Optional direct question that the current chat interaction
  with the user is intended to have answered.  For
  example, like getting the answer to a bill-of-materials
  related question from the LLM.

#### Defined in

[packages/core/src/types.ts:437](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L437)

***

### helpDocument?

> `optional` **helpDocument**: `string`

Optional help document that should be used when the chat
 interaction for a bill-of-materials line item has switched
 into HELP mode to answer a user's questions about the
 the current line item.

#### Defined in

[packages/core/src/types.ts:445](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L445)
