[@ai16z/eliza v0.1.5-alpha.5](../index.md) / buildFullRelationshipId

# Function: buildFullRelationshipId()

> **buildFullRelationshipId**(`roomId`, `userId`): `string`

Builds a full relationship ID by combining a room ID and a user ID.

## Parameters

• **roomId**: `string`

The ID of the room. Must be a non-empty string after trimming.

• **userId**: `string`

The ID of the user. Must be a non-empty string after trimming.

## Returns

`string`

A string in the format: `<trimmedRoomId>::<trimmedUserId>`.

## Throws

If:
- `roomId` is empty after trimming.
- `userId` is empty after trimming.
- `roomId` and `userId` have the same value after trimming.

## Defined in

[packages/core/src/relationships.ts:113](https://github.com/roschler/eliza/blob/main/packages/core/src/relationships.ts#L113)
