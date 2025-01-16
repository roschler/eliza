[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Action

# Interface: Action

Represents an action the agent can perform

## Properties

### similes

> **similes**: `string`[]

Similar action descriptions

#### Defined in

[packages/core/src/types.ts:506](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L506)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:509](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L509)

***

### examples

> **examples**: [`ActionExample`](ActionExample.md)[][]

Example usages

#### Defined in

[packages/core/src/types.ts:512](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L512)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:515](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L515)

***

### name

> **name**: `string`

Action name

#### Defined in

[packages/core/src/types.ts:518](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L518)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:521](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L521)
