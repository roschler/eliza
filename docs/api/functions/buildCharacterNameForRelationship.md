[@ai16z/eliza v0.1.5-alpha.5](../index.md) / buildCharacterNameForRelationship

# Function: buildCharacterNameForRelationship()

> **buildCharacterNameForRelationship**(`characterName`): `string`

Builds a standardized character name for a relationship.  The character
 names are the names found as the first string in a dotted string
 name that forms a character JSON primary file name.

## Parameters

• **characterName**: `string`

The name of the character. Must be a non-empty
 string after trimming.

## Returns

`string`

A string in the format: `character::<trimmedCharacterName>`.

## Throws

If:
- `characterName` is empty after trimming.

## Defined in

[packages/core/src/relationships.ts:83](https://github.com/roschler/eliza/blob/main/packages/core/src/relationships.ts#L83)
