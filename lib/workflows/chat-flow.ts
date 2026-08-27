import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import {
  convertToModelMessages,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import {
  searchProducts,
  getAllCategories,
  returnOrder,
  getProductDetails,
} from "@/lib/tools";

export async function chatFlow(messages: UIMessage[]) {
  "use workflow";
  const modelMessages = await convertToModelMessages(messages);
  const agent = new DurableAgent({
    model: "anthropic/claude-sonnet-4.6",
    instructions: `You are a helpful assistant for the Vercel swag store.
  Use getProductDetails whenever the user asks about a specific item by name or requests detailed information for a single product, and you can identify the exact item by its ID or slug.
  If the user asks about a specific item but you do not know the exact ID or slug, use searchProducts first to find the matching product, then call getProductDetails for the exact item.
  Use searchProducts when the user is browsing, asking what products are available, requesting recommendations, or searching by general terms and categories.
  When asked about a type or category of product, use the getAllCategories tool for valid category slugs before using searchProducts.
  When the user wants to return an order, use the returnOrder tool. Ask for the order ID and reason if they haven't provided them. Example order IDs are 11111, 22222, and 33333.`,
    tools: { searchProducts, getAllCategories, returnOrder, getProductDetails },
  });

  await agent.stream({
    messages: modelMessages,
    writable: getWritable<UIMessageChunk>(),
  });
}
