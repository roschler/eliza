[@ai16z/eliza v0.1.5-alpha.5](../index.md) / JOKER\_UUID\_AS\_ROOMS\_ID\_WILDCARD

# Variable: JOKER\_UUID\_AS\_ROOMS\_ID\_WILDCARD

> `const` **JOKER\_UUID\_AS\_ROOMS\_ID\_WILDCARD**: `"00000000-0000-0000-0000-000000000000"` = `"00000000-0000-0000-0000-000000000000"`

Use this UUID for functions like getGoals() that require a room ID, but
 in your application context you are not using a room ID.  For example,
 in the Pilterms relationship usage paradigm, the room ID is pre-pended
 to the user IDs participating in a relationship, so the room ID is not
 needed as a separate input parameter.

## Defined in

[packages/core/src/types.ts:20](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L20)
