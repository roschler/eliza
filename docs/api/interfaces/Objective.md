[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Objective

# Interface: Objective

Represents a single objective within a goal

## Properties

### id?

> `optional` **id**: `string`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:101](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L101)

***

### description

> **description**: `string`

Description of what needs to be achieved

#### Defined in

[packages/core/src/types.ts:104](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L104)

***

### completed

> **completed**: `boolean`

Whether objective is completed

#### Defined in

[packages/core/src/types.ts:107](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L107)

***

### resultData?

> `optional` **resultData**: `object`

The optional data object that is the result of the objective
  being completed.

#### Defined in

[packages/core/src/types.ts:112](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L112)
