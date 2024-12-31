[@ai16z/eliza v0.1.5-alpha.5](../index.md) / FullUserIdCharacterIdPair

# Type Alias: FullUserIdCharacterIdPair

> **FullUserIdCharacterIdPair**: `object`

Simple type to bind together the full user and character ID pair
 that comprises a user to agent/character relationship.

## Type declaration

### fullUserId

> **fullUserId**: [`UUID`](UUID.md)

The full user ID comprised of the room ID prefixed to the
 user ID with a delimiter.

### fullCharacterId

> **fullCharacterId**: [`UUID`](UUID.md)

The full character ID comprised of the room ID prefixed to the
 character name with a delimiter.  The character name is wrapped
 by a constant prefix and then encased in parentheses to avoid
 potential conflicts with other ID types.

## Defined in

[packages/core/src/types.ts:1281](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L1281)
