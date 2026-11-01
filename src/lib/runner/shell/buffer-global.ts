// isomorphic-git expects Node's global Buffer. Browsers don't have one, so
// this sets Next's bundled copy; it's imported before isomorphic-git.
import { Buffer } from "buffer";

const scope = globalThis as { Buffer?: typeof Buffer };
scope.Buffer ??= Buffer;
