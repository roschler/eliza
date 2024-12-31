[@ai16z/eliza v0.1.5-alpha.5](../index.md) / setExclusiveUserToCharacterRelationship

# Function: setExclusiveUserToCharacterRelationship()

> **setExclusiveUserToCharacterRelationship**(`roomId`, `userId`, `desiredAgent`): `Promise`\<`boolean`\>

Creates an EXCLUSIVE relationship record that binds the given user ID to the
 character name for the character assigned to the agent object,
 specific to the given room ID, while removing all and any other relationships
 the user has to anyone else in the specified room.

## Parameters

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the current room.

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the current user.

• **desiredAgent**: [`IAgentRuntime`](../interfaces/IAgentRuntime.md)

The agent/character that should be only one
  assigned to the user.

## Returns

`Promise`\<`boolean`\>

- Returns TRUE if the operation succeeded, FALSE if not or
  an error occurred.

## Defined in

[packages/core/src/relationships.ts:266](https://github.com/roschler/eliza/blob/main/packages/core/src/relationships.ts#L266)
