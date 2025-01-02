[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Evaluator

# Interface: Evaluator

Evaluator for assessing agent responses

## Properties

### alwaysRun?

> `optional` **alwaysRun**: `boolean`

Whether to always run

#### Defined in

[packages/core/src/types.ts:460](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L460)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:463](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L463)

***

### similes

> **similes**: `string`[]

Similar evaluator descriptions

#### Defined in

[packages/core/src/types.ts:466](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L466)

***

### examples

> **examples**: [`EvaluationExample`](EvaluationExample.md)[]

Example evaluations

#### Defined in

[packages/core/src/types.ts:469](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L469)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:472](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L472)

***

### name

> **name**: `string`

Evaluator name

#### Defined in

[packages/core/src/types.ts:475](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L475)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:478](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L478)
