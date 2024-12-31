[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Action

# Interface: Action

Represents an action the agent can perform

## Properties

### similes

> **similes**: `string`[]

Similar action descriptions

#### Defined in

[packages/core/src/types.ts:415](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L415)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:418](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L418)

***

### examples

> **examples**: [`ActionExample`](ActionExample.md)[][]

Example usages

#### Defined in

[packages/core/src/types.ts:421](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L421)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:424](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L424)

***

### name

> **name**: `string`

Action name

#### Defined in

[packages/core/src/types.ts:427](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L427)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:430](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L430)
