[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Goal

# Interface: Goal

Represents a high-level goal composed of objectives

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:129](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L129)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Room ID where goal exists

#### Defined in

[packages/core/src/types.ts:132](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L132)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

User ID of goal owner

#### Defined in

[packages/core/src/types.ts:135](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L135)

***

### name

> **name**: `string`

Name/title of the goal

#### Defined in

[packages/core/src/types.ts:138](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L138)

***

### status

> **status**: [`GoalStatus`](../enumerations/GoalStatus.md)

Current status

#### Defined in

[packages/core/src/types.ts:141](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L141)

***

### objectives

> **objectives**: [`Objective`](Objective.md)[]

Component objectives

#### Defined in

[packages/core/src/types.ts:144](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L144)
