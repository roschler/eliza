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

[packages/core/src/types.ts:322](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L322)

***

### agentId?

> `optional` **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

ID of agent in conversation

#### Defined in

[packages/core/src/types.ts:325](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L325)

***

### bio

> **bio**: `string`

Agent's biography

#### Defined in

[packages/core/src/types.ts:328](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L328)

***

### lore

> **lore**: `string`

Agent's background lore

#### Defined in

[packages/core/src/types.ts:331](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L331)

***

### messageDirections

> **messageDirections**: `string`

Message handling directions

#### Defined in

[packages/core/src/types.ts:334](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L334)

***

### postDirections

> **postDirections**: `string`

Post handling directions

#### Defined in

[packages/core/src/types.ts:337](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L337)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Current room/conversation ID

#### Defined in

[packages/core/src/types.ts:340](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L340)

***

### agentName?

> `optional` **agentName**: `string`

Optional agent name

#### Defined in

[packages/core/src/types.ts:343](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L343)

***

### senderName?

> `optional` **senderName**: `string`

Optional message sender name

#### Defined in

[packages/core/src/types.ts:346](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L346)

***

### actors

> **actors**: `string`

String representation of conversation actors

#### Defined in

[packages/core/src/types.ts:349](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L349)

***

### actorsData?

> `optional` **actorsData**: [`Actor`](Actor.md)[]

Optional array of actor objects

#### Defined in

[packages/core/src/types.ts:352](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L352)

***

### goals?

> `optional` **goals**: `string`

Optional string representation of goals

#### Defined in

[packages/core/src/types.ts:355](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L355)

***

### goalsData?

> `optional` **goalsData**: [`Goal`](Goal.md)[]

Optional array of goal objects

#### Defined in

[packages/core/src/types.ts:358](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L358)

***

### recentMessages

> **recentMessages**: `string`

Recent message history as string

#### Defined in

[packages/core/src/types.ts:361](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L361)

***

### recentMessagesData

> **recentMessagesData**: [`Memory`](Memory.md)[]

Recent message objects

#### Defined in

[packages/core/src/types.ts:364](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L364)

***

### actionNames?

> `optional` **actionNames**: `string`

Optional valid action names

#### Defined in

[packages/core/src/types.ts:367](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L367)

***

### actions?

> `optional` **actions**: `string`

Optional action descriptions

#### Defined in

[packages/core/src/types.ts:370](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L370)

***

### actionsData?

> `optional` **actionsData**: [`Action`](Action.md)[]

Optional action objects

#### Defined in

[packages/core/src/types.ts:373](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L373)

***

### actionExamples?

> `optional` **actionExamples**: `string`

Optional action examples

#### Defined in

[packages/core/src/types.ts:376](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L376)

***

### providers?

> `optional` **providers**: `string`

Optional provider descriptions

#### Defined in

[packages/core/src/types.ts:379](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L379)

***

### responseData?

> `optional` **responseData**: [`Content`](Content.md)

Optional response content

#### Defined in

[packages/core/src/types.ts:382](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L382)

***

### recentInteractionsData?

> `optional` **recentInteractionsData**: [`Memory`](Memory.md)[]

Optional recent interaction objects

#### Defined in

[packages/core/src/types.ts:385](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L385)

***

### recentInteractions?

> `optional` **recentInteractions**: `string`

Optional recent interactions string

#### Defined in

[packages/core/src/types.ts:388](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L388)

***

### formattedConversation?

> `optional` **formattedConversation**: `string`

Optional formatted conversation

#### Defined in

[packages/core/src/types.ts:391](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L391)

***

### knowledge?

> `optional` **knowledge**: `string`

Optional formatted knowledge

#### Defined in

[packages/core/src/types.ts:394](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L394)

***

### knowledgeData?

> `optional` **knowledgeData**: [`KnowledgeItem`](../type-aliases/KnowledgeItem.md)[]

Optional knowledge data

#### Defined in

[packages/core/src/types.ts:396](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L396)

***

### simpleQuestion?

> `optional` **simpleQuestion**: `string`

Optional direct question that the current chat interaction
  with the user is intended to have answered.  For
  example, like getting the answer to a bill-of-materials
  related question from the LLM.

#### Defined in

[packages/core/src/types.ts:403](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L403)

***

### helpDocument?

> `optional` **helpDocument**: `string`

Optional help document that should be used when the chat
 interaction for a bill-of-materials line item has switched
 into HELP mode to answer a user's questions about the
 the current line item.

#### Defined in

[packages/core/src/types.ts:411](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L411)
