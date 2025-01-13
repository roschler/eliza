[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Evaluator

# Interface: Evaluator

Evaluator for assessing agent responses

## Properties

### alwaysRun?

> `optional` **alwaysRun**: `boolean`

Whether to always run

#### Defined in

[packages/core/src/types.ts:530](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L530)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:533](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L533)

***

### similes

> **similes**: `string`[]

Similar evaluator descriptions

#### Defined in

[packages/core/src/types.ts:536](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L536)

***

### examples

> **examples**: [`EvaluationExample`](EvaluationExample.md)[]

Example evaluations

#### Defined in

[packages/core/src/types.ts:539](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L539)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:542](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L542)

***

### name

> **name**: `string`

Evaluator name

#### Defined in

[packages/core/src/types.ts:545](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L545)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:548](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L548)
