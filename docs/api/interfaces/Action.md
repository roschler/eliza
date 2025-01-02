[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Action

# Interface: Action

Represents an action the agent can perform

## Properties

### similes

> **similes**: `string`[]

Similar action descriptions

#### Defined in

[packages/core/src/types.ts:423](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L423)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:426](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L426)

***

### examples

> **examples**: [`ActionExample`](ActionExample.md)[][]

Example usages

#### Defined in

[packages/core/src/types.ts:429](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L429)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:432](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L432)

***

### name

> **name**: `string`

Action name

#### Defined in

[packages/core/src/types.ts:435](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L435)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:438](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L438)
