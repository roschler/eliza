[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Evaluator

# Interface: Evaluator

Evaluator for assessing agent responses

## Properties

### alwaysRun?

> `optional` **alwaysRun**: `boolean`

Whether to always run

#### Defined in

[packages/core/src/types.ts:564](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L564)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:567](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L567)

***

### similes

> **similes**: `string`[]

Similar evaluator descriptions

#### Defined in

[packages/core/src/types.ts:570](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L570)

***

### examples

> **examples**: [`EvaluationExample`](EvaluationExample.md)[]

Example evaluations

#### Defined in

[packages/core/src/types.ts:573](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L573)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:576](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L576)

***

### name

> **name**: `string`

Evaluator name

#### Defined in

[packages/core/src/types.ts:579](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L579)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:582](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L582)
