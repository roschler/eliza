[@ai16z/eliza v0.1.5-alpha.5](../index.md) / isUuid

# Function: isUuid()

> **isUuid**(`str`): `boolean`

Checks if a given string is in the UUID format.

The UUID format is defined as:
00000000-0000-0000-0000-000000000000
Where "0" represents a hexadecimal digit (0-9, a-f).

## Parameters

• **str**: `string`

The string to be validated.

## Returns

`boolean`

`true` if the string matches the UUID format, otherwise `false`.

## Defined in

[packages/core/src/uuid.ts:63](https://github.com/roschler/eliza/blob/main/packages/core/src/uuid.ts#L63)
