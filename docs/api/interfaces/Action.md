[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Action

# Interface: Action

Represents an action the agent can perform

## Properties

### similes

> **similes**: `string`[]

Similar action descriptions

#### Defined in

[packages/core/src/types.ts:493](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L493)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:496](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L496)

***

### examples

> **examples**: [`ActionExample`](ActionExample.md)[][]

Example usages

#### Defined in

[packages/core/src/types.ts:499](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L499)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:502](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L502)

***

### name

> **name**: `string`

Action name

#### Defined in

[packages/core/src/types.ts:505](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L505)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:508](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L508)
