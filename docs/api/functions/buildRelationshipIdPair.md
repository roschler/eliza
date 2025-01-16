[@ai16z/eliza v0.1.5-alpha.5](../index.md) / buildRelationshipIdPair

# Function: buildRelationshipIdPair()

> **buildRelationshipIdPair**(`roomId`, `userId`, `characterName`): [`FullUserIdCharacterIdPair`](../type-aliases/FullUserIdCharacterIdPair.md)

Given a room ID, a user ID, and a character name (from an agent)
 build the pair of IDs necessary to uniquely identify the
 relationship within the given room.

## Parameters

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the room the relationship exists in.

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

The ID of the user that is bound to the agent/character.

• **characterName**: `string`

The name of the character as found in the character
 JSON file the agent was initialized with.

## Returns

[`FullUserIdCharacterIdPair`](../type-aliases/FullUserIdCharacterIdPair.md)

- Returns a UUID built from the given parameters.

## Defined in

[packages/core/src/relationships.ts:164](https://github.com/roschler/eliza/blob/main/packages/core/src/relationships.ts#L164)
