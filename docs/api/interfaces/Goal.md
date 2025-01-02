[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Goal

# Interface: Goal

Represents a high-level goal composed of objectives

## Properties

### id?

> `optional` **id**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:137](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L137)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Room ID where goal exists

#### Defined in

[packages/core/src/types.ts:140](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L140)

***

### userId

> **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

User ID of goal owner

#### Defined in

[packages/core/src/types.ts:143](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L143)

***

### name

> **name**: `string`

Name/title of the goal

#### Defined in

[packages/core/src/types.ts:146](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L146)

***

### status

> **status**: [`GoalStatus`](../enumerations/GoalStatus.md)

Current status

#### Defined in

[packages/core/src/types.ts:149](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L149)

***

### objectives

> **objectives**: [`Objective`](Objective.md)[]

Component objectives

#### Defined in

[packages/core/src/types.ts:152](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L152)
