[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Goal

# Interface: Goal

Represents a high-level goal composed of objectives

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:216](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L216)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Room ID where goal exists

#### Defined in

[packages/core/src/types.ts:219](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L219)

***

### agentId?

> `optional` **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

If specified, then this goal is
  tied to a specific user to
  agent/character relationship
  belonging to the room.

#### Defined in

[packages/core/src/types.ts:226](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L226)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

User ID of goal owner

#### Defined in

[packages/core/src/types.ts:229](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L229)

***

### name

> **name**: `string`

Name/title of the goal

#### Defined in

[packages/core/src/types.ts:232](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L232)

***

### status

> **status**: [`GoalStatus`](../enumerations/GoalStatus.md)

Current status

#### Defined in

[packages/core/src/types.ts:235](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L235)

***

### objectives

> **objectives**: [`Objective`](Objective.md)[]

Component objectives

#### Defined in

[packages/core/src/types.ts:238](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L238)

***

### description?

> `optional` **description**: `string`

A brief description of the goal.

#### Defined in

[packages/core/src/types.ts:241](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L241)
