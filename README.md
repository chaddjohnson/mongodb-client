# Mongoose Client Wrapper

Optimized for use with Lambda, but still compatible with non-Lambda environments.

This library takes care of the following:

1. Allow connections to multiple MongoDB databases (rather than assuming only one via `mongoose.connection`).
1. Set optimal connection default settings geared toward Lambda (but allow overrides for non-Lambda environments).
1. Provide convenience method for checking if the client is connected or connecting.
1. Provide convenience method for disconnecting the client.
