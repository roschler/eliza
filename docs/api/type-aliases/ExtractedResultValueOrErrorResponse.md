[@ai16z/eliza v0.1.5-alpha.5](../index.md) / ExtractedResultValueOrErrorResponse

# Type Alias: ExtractedResultValueOrErrorResponse

> **ExtractedResultValueOrErrorResponse**: `object`

This type is returned by functions like validateMainQuestionResultValue()
 that either return a ResultAndCharacterName if the LLM response contained
 a valid bill-of-materials result, or ContentOrNull object that should
 be used as an error response, if the LLM failed to contain a valid
 result value.

## Type declaration

### resultAndCharacterNameOrNull

> **resultAndCharacterNameOrNull**: [`ResultAndCharacterName`](ResultAndCharacterName.md)

If the LLM response contained a valid bill-of-materials result
 value, then this property will contain it.  Otherwise, it
 should be NULL.

### contentAsErrorResponseOrNull

> **contentAsErrorResponseOrNull**: [`ContentOrNull`](ContentOrNull.md)

If the LLM response did NOT contain a valid bill-of-materials result
 value, then this property will a Content object that will
 contain the error response that should be shown to the user,
 or handled by downstream code.  Otherwise, it should be NULL.

## Defined in

[packages/core/src/types.ts:40](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L40)
