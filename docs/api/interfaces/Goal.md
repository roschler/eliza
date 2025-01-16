[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Goal

# Interface: Goal

Represents a high-level goal composed of objectives

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:195](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L195)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Room ID where goal exists

#### Defined in

[packages/core/src/types.ts:198](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L198)

***

### agentId?

> `optional` **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

If specified, then this goal is
  tied to a specific user to
  agent/character relationship
  belonging to the room.

#### Defined in

[packages/core/src/types.ts:205](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L205)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

User ID of goal owner

#### Defined in

[packages/core/src/types.ts:208](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L208)

***

### name

> **name**: `string`

Name/title of the goal

#### Defined in

[packages/core/src/types.ts:211](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L211)

***

### status

> **status**: [`GoalStatus`](../enumerations/GoalStatus.md)

Current status

#### Defined in

[packages/core/src/types.ts:214](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L214)

***

### objectives

> **objectives**: [`Objective`](Objective.md)[]

Component objectives

#### Defined in

[packages/core/src/types.ts:217](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L217)

***

### description?

> `optional` **description**: `string`

A brief description of the goal.

#### Defined in

[packages/core/src/types.ts:220](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L220)
