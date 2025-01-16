[@ai16z/eliza v0.1.5-alpha.5](../index.md) / buildFullRelationshipId

# Function: buildFullRelationshipId()

> **buildFullRelationshipId**(`roomId`, `userId`): [`UUID`](../type-aliases/UUID.md)

Builds a full relationship ID by combining a room ID and a user ID.

## Parameters

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the room. Must be a non-empty string after trimming.

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the user. Must be a non-empty string after trimming.

## Returns

[`UUID`](../type-aliases/UUID.md)

A string in the format: `<trimmedRoomId>::<trimmedUserId>`.

## Throws

If:
- `roomId` is empty after trimming.
- `userId` is empty after trimming.
- `roomId` and `userId` have the same value after trimming.

## Defined in

[packages/core/src/relationships.ts:116](https://github.com/roschler/eliza/blob/main/packages/core/src/relationships.ts#L116)
