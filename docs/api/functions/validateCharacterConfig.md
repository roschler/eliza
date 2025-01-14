[@ai16z/eliza v0.1.5-alpha.5](../index.md) / validateCharacterConfig

# Function: validateCharacterConfig()

> **validateCharacterConfig**(`json`): [`CharacterConfig`](../type-aliases/CharacterConfig.md)

Validates a character configuration JSON object against the CharacterSchema.

This function provides detailed error reporting, including the exact paths
to invalid fields and descriptive messages for validation errors.

## Parameters

• **json**: `unknown`

The JSON object to validate.

## Returns

[`CharacterConfig`](../type-aliases/CharacterConfig.md)

- The validated character configuration.

## Throws

- If validation fails, an error with detailed information is thrown.

## Defined in

[packages/core/src/environment.ts:160](https://github.com/roschler/eliza/blob/main/packages/core/src/environment.ts#L160)
