[@ai16z/eliza v0.1.5-alpha.5](../index.md) / setUserToCharacterRelationship

# Function: setUserToCharacterRelationship()

> **setUserToCharacterRelationship**(`roomId`, `userId`, `desiredAgent`): `Promise`\<`boolean`\>

Creates a relationship record that binds the given user ID to the
 character name for the character assigned to the agent object,
 specific to the given room ID.

## Parameters

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the current room.

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the current user.

• **desiredAgent**: [`IAgentRuntime`](../interfaces/IAgentRuntime.md)

A valid agent object.

## Returns

`Promise`\<`boolean`\>

## Defined in

[packages/core/src/relationships.ts:231](https://github.com/roschler/eliza/blob/main/packages/core/src/relationships.ts#L231)
