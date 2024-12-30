[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Goal

# Interface: Goal

Represents a high-level goal composed of objectives

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:121](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L121)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Room ID where goal exists

#### Defined in

[packages/core/src/types.ts:124](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L124)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

User ID of goal owner

#### Defined in

[packages/core/src/types.ts:127](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L127)

***

### name

> **name**: `string`

Name/title of the goal

#### Defined in

[packages/core/src/types.ts:130](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L130)

***

### status

> **status**: [`GoalStatus`](../enumerations/GoalStatus.md)

Current status

#### Defined in

[packages/core/src/types.ts:133](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L133)

***

### objectives

> **objectives**: [`Objective`](Objective.md)[]

Component objectives

#### Defined in

[packages/core/src/types.ts:136](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L136)
