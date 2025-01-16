[@ai16z/eliza v0.1.5-alpha.5](../index.md) / isRelated

# Function: isRelated()

> **isRelated**(`roomId`, `userId`, `agentObj`): `Promise`\<[`IAgentRuntimeOrNull`](../type-aliases/IAgentRuntimeOrNull.md)\>

This function checks to see if the given room ID +
 user ID combination has been assigned a particular
 agent.

## Parameters

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the current room.

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the user.

• **agentObj**: [`IAgentRuntime`](../interfaces/IAgentRuntime.md)

An agent object.

## Returns

`Promise`\<[`IAgentRuntimeOrNull`](../type-aliases/IAgentRuntimeOrNull.md)\>

- If the given agent is assigned to the
 given user in the given room, the IAgentRuntime
 object for that agent will be returned.  Otherwise,
 null will be returned.

## Defined in

[packages/core/src/relationships.ts:320](https://github.com/roschler/eliza/blob/main/packages/core/src/relationships.ts#L320)
