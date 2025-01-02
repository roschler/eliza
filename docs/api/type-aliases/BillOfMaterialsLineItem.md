[@ai16z/eliza v0.1.5-alpha.5](../index.md) / BillOfMaterialsLineItem

# Type Alias: BillOfMaterialsLineItem

> **BillOfMaterialsLineItem**: `object`

A single piece of information that belongs to a
 BillOfMaterials object.

## Type declaration

### name

> **name**: `string`

The name of the field.  E.g. - "minting fee". *

### type

> **type**: `string`

The type of the field.  E.g. - "string", or "number", etc. *

### prompt

> **prompt**: `string`

The question to ask the user to get the desired value from them. *

### defaultValue?

> `optional` **defaultValue**: [`BillOfMaterialsResultType`](BillOfMaterialsResultType.md)

The default value for the result.  If present, then the LLM
 will be given this value to suggest it to the user.

### isOptional

> **isOptional**: `boolean`

If FALSE, then the character will ask the user for the field value
  but will accept an empty answer as a response.  If TRUE, then
  the character will keep trying to get an answer until successful,
  or the user abandons the chat.

### listOfValidValues?

> `optional` **listOfValidValues**: `string`[]

-------------------------- BEGIN: STRING TYPE ONLY ------------------------
The following fields only apply to string type line items.
Optional field that if present, must be an array of string values.
 If present, then if the user's response value is not in the list
 the character will try again to get a valid value.

### isInteger?

> `optional` **isInteger**: `boolean`

If present and has the value TRUE, then the character will work to
 obtain, and only accept, an integer value.

### minVal?

> `optional` **minVal**: `number`

If present, then the character will only accept a number value that
 is greater than or equal to this value.  This value MUST be less
 than the maxVal value if that value exists.

### maxVal?

> `optional` **maxVal**: `number`

If present, then the character will only accept a number value that
 is less than or equal to this value.  This value MUST be greater
 than the minVal value if that value exists.

### unitsDescription?

> `optional` **unitsDescription**: `string`

If present, then this string will be appended to any numeric values
 shown to the user (e.g. - "The minimum cost for an NFT is 1 Eth"
 where "Eth" would be the unitsDescription value.").

## Defined in

[packages/core/src/types.ts:639](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L639)
