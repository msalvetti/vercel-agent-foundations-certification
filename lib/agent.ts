/**
 * This is where your agent will live.
 *
 * During the workshop you'll define a `ToolLoopAgent` here, give it a model
 * and instructions, and later add tools (web search, sandbox, etc.). The
 * route handler in `app/api/chat/route.ts` and the `useChat` call in
 * `components/agent-chat.tsx` will both import from this file.
 *
 * Workshop docs: https://agent-foundations-certification.vercel.app/docs/chat-agent
 */

import { 
    ToolLoopAgent,
    type InferAgentUIMessage, 
    type UIToolInvocation,  
} from "ai";
import { getProductDetails, searchProducts, getAllCategories, returnOrder } from "@/lib/tools";

export type ShoppingAgentUIMessage = InferAgentUIMessage<typeof shoppingAgent>;
export type SearchProductsToolInvocation = UIToolInvocation<typeof searchProducts>;
export type ProductDetailsToolInvocation = UIToolInvocation<typeof getProductDetails>;

export const shoppingAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.6",
  instructions: `You are a helpful assistant for the Vercel swag store.
  Use getProductDetails whenever the user asks about a specific item by name or requests detailed information for a single product, and you can identify the exact item by its ID or slug.
  If the user asks about a specific item but you do not know the exact ID or slug, use searchProducts first to find the matching product, then call getProductDetails for the exact item.
  Use searchProducts when the user is browsing, asking what products are available, requesting recommendations, or searching by general terms and categories.
  When asked about a type or category of product, use the getAllCategories tool for valid category slugs before using searchProducts.
  When the user wants to return an order, use the returnOrder tool. Ask for the order ID and reason if they haven't provided them. Example order IDs are 11111, 22222, and 33333.`,
  tools: { getProductDetails, searchProducts, getAllCategories, returnOrder },
});
