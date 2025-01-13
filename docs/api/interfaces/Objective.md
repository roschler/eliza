[@ai16z/eliza v0.1.5-alpha.5](../index.md) / Objective

# Interface: Objective

Represents a single objective within a goal

## Properties

### id?

> `optional` **id**: `string`

Optional unique identifier

#### Defined in

[packages/core/src/types.ts:123](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L123)

***

### description

> **description**: `string`

Description of what needs to be achieved

#### Defined in

[packages/core/src/types.ts:126](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L126)

***

### completed

> **completed**: `boolean`

Whether objective is completed

#### Defined in

[packages/core/src/types.ts:129](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L129)

***

### isOptionalFieldDesiredByUser?

> `optional` **isOptionalFieldDesiredByUser**: `boolean`

This flag is set to TRUE if the user indicated they
 are interested in (this) optional line item, if it
 is optional, or FALSE if they indicated they are not
 interested in it.

#### Defined in

[packages/core/src/types.ts:137](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L137)

***

### isInHelpMode

> **isInHelpMode**: `boolean`

This flag is set to TRUE if the users asks a help
 question about the line item, and we have switched
 to HELP mode until the user indicates we have
 properly answered their question, or they cancel
 the session.

#### Defined in

[packages/core/src/types.ts:146](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L146)

***

### resultData?

> `optional` **resultData**: [`BillOfMaterialsResultType`](../type-aliases/BillOfMaterialsResultType.md)

The optional data object that is the result of the objective
  being completed.

NOTE: If this objective carries an optional bill-of-materials
 line item object, and the user is not interested in the
 line item, then this field will contain specifically NULL.

NOTE: Do NOT initialize this property to NULL!  If the
 line item is an optional value that it has NOT been
 asked yet, we expect this value to be undefined.  If
 the line item is an optional value, and it HAS
 been asked, AND the user declined interest in it,
 then it will be NULL.

#### Defined in

[packages/core/src/types.ts:162](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L162)

***

### billOfMaterialsLineItem?

> `optional` **billOfMaterialsLineItem**: [`BillOfMaterialsLineItem`](../type-aliases/BillOfMaterialsLineItem.md)

If present, then this object is a bill of materials line
 item objective.

#### Defined in

[packages/core/src/types.ts:168](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L168)
