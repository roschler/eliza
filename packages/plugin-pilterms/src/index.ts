export * from "./actions/pickLicense";
export * from "./types";

import type { Plugin } from "@ai16z/eliza";
import { pilTermsInterviewAction } from "./actions/pickLicense";

export const pilTermsPlugin: Plugin = {
    name: "pilterms",
    description: "pilTerms plugin.  Handles chat with a user that wants to add a digital asset to the Story Protocol platform.",
    providers: [],
    evaluators: [],
    services: [],
    actions: [pilTermsInterviewAction],
};

export default pilTermsPlugin;
