[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Evaluator

# Interface: Evaluator

Evaluator for assessing agent responses

## Properties

### alwaysRun?

> `optional` **alwaysRun**: `boolean`

Whether to always run

#### Defined in

[packages/core/src/types.ts:543](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L543)

***

### description

> **description**: `string`

Detailed description

#### Defined in

[packages/core/src/types.ts:546](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L546)

***

### similes

> **similes**: `string`[]

Similar evaluator descriptions

#### Defined in

[packages/core/src/types.ts:549](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L549)

***

### examples

> **examples**: [`EvaluationExample`](EvaluationExample.md)[]

Example evaluations

#### Defined in

[packages/core/src/types.ts:552](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L552)

***

### handler

> **handler**: [`Handler`](../type-aliases/Handler.md)

Handler function

#### Defined in

[packages/core/src/types.ts:555](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L555)

***

### name

> **name**: `string`

Evaluator name

#### Defined in

[packages/core/src/types.ts:558](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L558)

***

### validate

> **validate**: [`Validator`](../type-aliases/Validator.md)

Validation function

#### Defined in

[packages/core/src/types.ts:561](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L561)
