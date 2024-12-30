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

[packages/core/src/types.ts:251](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L251)

***

### agentId?

> `optional` **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

ID of agent in conversation

#### Defined in

[packages/core/src/types.ts:254](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L254)

***

### bio

> **bio**: `string`

Agent's biography

#### Defined in

[packages/core/src/types.ts:257](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L257)

***

### lore

> **lore**: `string`

Agent's background lore

#### Defined in

[packages/core/src/types.ts:260](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L260)

***

### messageDirections

> **messageDirections**: `string`

Message handling directions

#### Defined in

[packages/core/src/types.ts:263](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L263)

***

### postDirections

> **postDirections**: `string`

Post handling directions

#### Defined in

[packages/core/src/types.ts:266](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L266)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Current room/conversation ID

#### Defined in

[packages/core/src/types.ts:269](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L269)

***

### agentName?

> `optional` **agentName**: `string`

Optional agent name

#### Defined in

[packages/core/src/types.ts:272](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L272)

***

### senderName?

> `optional` **senderName**: `string`

Optional message sender name

#### Defined in

[packages/core/src/types.ts:275](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L275)

***

### actors

> **actors**: `string`

String representation of conversation actors

#### Defined in

[packages/core/src/types.ts:278](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L278)

***

### actorsData?

> `optional` **actorsData**: [`Actor`](Actor.md)[]

Optional array of actor objects

#### Defined in

[packages/core/src/types.ts:281](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L281)

***

### goals?

> `optional` **goals**: `string`

Optional string representation of goals

#### Defined in

[packages/core/src/types.ts:284](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L284)

***

### goalsData?

> `optional` **goalsData**: [`Goal`](Goal.md)[]

Optional array of goal objects

#### Defined in

[packages/core/src/types.ts:287](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L287)

***

### recentMessages

> **recentMessages**: `string`

Recent message history as string

#### Defined in

[packages/core/src/types.ts:290](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L290)

***

### recentMessagesData

> **recentMessagesData**: [`Memory`](Memory.md)[]

Recent message objects

#### Defined in

[packages/core/src/types.ts:293](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L293)

***

### actionNames?

> `optional` **actionNames**: `string`

Optional valid action names

#### Defined in

[packages/core/src/types.ts:296](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L296)

***

### actions?

> `optional` **actions**: `string`

Optional action descriptions

#### Defined in

[packages/core/src/types.ts:299](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L299)

***

### actionsData?

> `optional` **actionsData**: [`Action`](Action.md)[]

Optional action objects

#### Defined in

[packages/core/src/types.ts:302](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L302)

***

### actionExamples?

> `optional` **actionExamples**: `string`

Optional action examples

#### Defined in

[packages/core/src/types.ts:305](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L305)

***

### providers?

> `optional` **providers**: `string`

Optional provider descriptions

#### Defined in

[packages/core/src/types.ts:308](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L308)

***

### responseData?

> `optional` **responseData**: [`Content`](Content.md)

Optional response content

#### Defined in

[packages/core/src/types.ts:311](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L311)

***

### recentInteractionsData?

> `optional` **recentInteractionsData**: [`Memory`](Memory.md)[]

Optional recent interaction objects

#### Defined in

[packages/core/src/types.ts:314](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L314)

***

### recentInteractions?

> `optional` **recentInteractions**: `string`

Optional recent interactions string

#### Defined in

[packages/core/src/types.ts:317](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L317)

***

### formattedConversation?

> `optional` **formattedConversation**: `string`

Optional formatted conversation

#### Defined in

[packages/core/src/types.ts:320](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L320)

***

### knowledge?

> `optional` **knowledge**: `string`

Optional formatted knowledge

#### Defined in

[packages/core/src/types.ts:323](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L323)

***

### knowledgeData?

> `optional` **knowledgeData**: [`KnowledgeItem`](../type-aliases/KnowledgeItem.md)[]

Optional knowledge data

#### Defined in

[packages/core/src/types.ts:325](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L325)
