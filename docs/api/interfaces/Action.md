[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Action

# Interface: Action

Represents an action the agent can perform

## Properties

### similes

> **similes**: `string`[]

Similar action descriptions

#### Defined in

[packages/core/src/types.ts:527](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L527)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:530](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L530)

***

### examples

> **examples**: [`ActionExample`](ActionExample.md)[][]

Example usages

#### Defined in

[packages/core/src/types.ts:533](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L533)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:536](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L536)

***

### name

> **name**: `string`

Action name

#### Defined in

[packages/core/src/types.ts:539](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L539)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:542](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L542)
