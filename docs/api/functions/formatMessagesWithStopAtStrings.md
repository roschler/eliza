[@ai16z/eliza v0.1.5-alpha.5](../index.md) / formatMessagesWithStopAtStrings

# Function: formatMessagesWithStopAtStrings()

> **formatMessagesWithStopAtStrings**(`__namedParameters`): `string`

Format messages into a string

## Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.messages**: [`Memory`](../interfaces/Memory.md)[]

• **\_\_namedParameters.actors**: [`Actor`](../interfaces/Actor.md)[]

• **\_\_namedParameters.stopAtStrings**: `string`[]

## Returns

`string`

string - Returns all the relevant messages in newest first
 with each memory being turned into a formatted message and each formatted
 message delimited by a line feed.

## Defined in

[packages/core/src/messages.ts:171](https://github.com/roschler/eliza/blob/main/packages/core/src/messages.ts#L171)
