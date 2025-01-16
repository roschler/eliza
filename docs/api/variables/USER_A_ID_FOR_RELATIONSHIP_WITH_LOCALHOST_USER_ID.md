[@ai16z/eliza v0.1.5-alpha.5](../index.md) / USER\_A\_ID\_FOR\_RELATIONSHIP\_WITH\_LOCALHOST\_USER\_ID

# Variable: USER\_A\_ID\_FOR\_RELATIONSHIP\_WITH\_LOCALHOST\_USER\_ID

> `const` **USER\_A\_ID\_FOR\_RELATIONSHIP\_WITH\_LOCALHOST\_USER\_ID**: `"00000000-0000-0000-0000-000000000001"` = `"00000000-0000-0000-0000-000000000001"`

This is the "fake" USER ID we use to store the UUID we dynamically
 create on-demand for the LOCALHOST user that is (may be) running the
 system from a read-line loop, directly from the host PC.  The
 dynamically created UUID is stored in the second user ID field belonging
 to a relationship record we write into the database, with the "fake"
 USER ID as the first user ID in that record.

## Defined in

[packages/core/src/types.ts:52](https://github.com/roschler/eliza/blob/main/packages/core/src/types.ts#L52)
