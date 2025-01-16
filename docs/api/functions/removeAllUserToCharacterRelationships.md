[@ai16z/eliza v0.1.5-alpha.5](../index.md) / removeAllUserToCharacterRelationships

# Function: removeAllUserToCharacterRelationships()

> **removeAllUserToCharacterRelationships**(`roomId`, `userId`, `agentRegistry`): `Promise`\<`boolean`\>

Given a room, a user, and the current agent/character registry containing
 the agent initialized for the system, remove any "relationship" records
 between the current user and any of the agent/characters in the registry
 belonging to the specified room.

## Parameters

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the current room.

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the current user.

• **agentRegistry**: [`IAgentRuntime`](../interfaces/IAgentRuntime.md)[]

An array of IAgentRuntime objects that contains
 all the agent/character objects that were instantiated when the
 system was launched.

## Returns

`Promise`\<`boolean`\>

- Returns TRUE if the operation succeeded, FALSE if there
 was an error during the operation.  Note, if no existing
 relationships existed then TRUE will still be returned because
 the operation is still considered successful.

## Defined in

[packages/core/src/relationships.ts:191](https://github.com/roschler/eliza/blob/main/packages/core/src/relationships.ts#L191)
