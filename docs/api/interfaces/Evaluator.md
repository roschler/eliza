[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Evaluator

# Interface: Evaluator

Evaluator for assessing agent responses

## Properties

### alwaysRun?

> `optional` **alwaysRun**: `boolean`

Whether to always run

#### Defined in

[packages/core/src/types.ts:452](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L452)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:455](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L455)

***

### similes

> **similes**: `string`[]

Similar evaluator descriptions

#### Defined in

[packages/core/src/types.ts:458](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L458)

***

### examples

> **examples**: [`EvaluationExample`](EvaluationExample.md)[]

Example evaluations

#### Defined in

[packages/core/src/types.ts:461](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L461)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:464](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L464)

***

### name

> **name**: `string`

Evaluator name

#### Defined in

[packages/core/src/types.ts:467](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L467)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:470](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L470)
