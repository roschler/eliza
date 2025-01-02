[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Objective

# Interface: Objective

Represents a single objective within a goal

## Properties

### id?

> `optional` **id**: `string`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:103](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L103)

***

### description

> **description**: `string`

Description of what needs to be achieved

#### Defined in

[packages/core/src/types.ts:106](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L106)

***

### completed

> **completed**: `boolean`

Whether objective is completed

#### Defined in

[packages/core/src/types.ts:109](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L109)

***

### resultData

> **resultData**: `object`

The optional data object that is the result of the objective
  being completed.

#### Defined in

[packages/core/src/types.ts:114](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L114)

***

### billOfMaterialsLineItem?

> `optional` **billOfMaterialsLineItem**: [`BillOfMaterialsLineItem`](../type-aliases/BillOfMaterialsLineItem.md)

If present, then this object is a bill of materials line
 item objective.

#### Defined in

[packages/core/src/types.ts:120](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L120)
