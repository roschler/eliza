import {
    composeContext,
    elizaLogger,
    generateObjectDEPRECATED,
    HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State, generateText,
} from "@ai16z/eliza";
import { pickLicenseTemplate } from "../templates";

export { pickLicenseTemplate };

const bVerbose = true;

const ACTION_NAME_STORY_PROTOCOL_INTERVIEW = 'STORY_PROTOCOL_INTERVIEW';

// -------------------- BEGIN: ACTION, Dialog Control ------------

/**
 * This action is the top level dialog control action.  It
 *  decides what context is the active context where to route
 *  control based on the decided context.
 */
export const pilTermsInterviewAction = {
    name: ACTION_NAME_STORY_PROTOCOL_INTERVIEW,
    description: "Manages the conversation control in regards to picking the best Story Protocol license for the user's digital asset, filling out the necessary fields for the license terms once the license has been chosen, and then crafting a Story Protocol plugin action so that the Story Protocol plugin registers the user's digital asset with the selected license and necessary parameter values.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const errPrefix = `(pickLicense::handler) `;

        elizaLogger.log(`Starting ${ACTION_NAME_STORY_PROTOCOL_INTERVIEW} handler...`);

        try {
            // initialize or update state
            if (!state) {
                // Remember, calling composeState() is computationally
                //  expensive!
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // composeContext will replace the substitution variables
            //  in our message template with the values found in the
            //  "state" variable.
            const pilTermsContext = composeContext({
                state,
                template: pickLicenseTemplate,
            });

            const content = await generateObjectDEPRECATED({
                runtime,
                context: pilTermsContext,
                modelClass: ModelClass.SMALL,
            });

            const context = composeContext({
                state,
                template: pickLicenseTemplate,
            });

            if (bVerbose) {
                elizaLogger.log(`${errPrefix}Making pick license LLM call with context: `, context);
            }

            // Make the LLM call.
            const response = await generateText({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            if (bVerbose) {
                // Process the response.
                elizaLogger.log(`${errPrefix}Response received: `, response);
            }

            // if license terms were already attached
            callback?.({
                text: `${errPrefix}Not implemented yet but pizza is nice!`,
            });
            return true;
        } catch (e) {
            const errMsg =
                `${errPrefix}Error executing PilTerms dialog control: ${e.message}`;

            elizaLogger.error(errMsg);
            callback?.({ text: errMsg });
            return false;
        }
    },
    template: pickLicenseTemplate,
    validate: async (runtime: IAgentRuntime) => {
        // const privateKey = runtime.getSetting("STORY_PRIVATE_KEY");
        // return typeof privateKey === "string" && privateKey.startsWith("0x");

        // TODO: Add the correct validation logic.
        return true;
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Hi",
                },
            },
            {
                user: "user",
                content: {
                    text: "Now what?",
                },
            },
            {
                user: "user",
                content: {
                    text: "I want to register my NFT with Story Protocol",
                },
            },
            {
                user: "user",
                content: {
                    text: "What do I do now?",
                },
            },
            {
                user: "user",
                content: {
                    text: "How do I mint my NFT?",
                },
            },
        ],
    ],
    similes: [],
};


// -------------------- END  : ACTION, Dialog Control ------------

