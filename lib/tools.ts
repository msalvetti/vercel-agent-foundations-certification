/**
 * This is where the tools for your agent will live.
 *
 * During the workshop you'll define tools in this file that your agents
 * will choose to run depending on the question or request that is made
 * to them.
 *
 * Workshop docs: https://agent-foundations-certification.vercel.app/docs/tools
 */

import { tool } from "ai";
import { z } from "zod";
import { start } from "workflow/api";
import { returnFlow } from "./workflows/return-flow";
import {
  ApiRequestError,
  getCategories,
  getProductById,
  getProductStock,
  getProducts,
} from "@/lib/api";

export const getAllCategories = tool({
  description: `List every product category available in the Vercel swag store, along with the number of products in each. Use this when the user asks what categories exist, what kinds of products are sold, or wants to browse the store at a high level.`,
  inputSchema: z.object({}),
  execute: async () => {
    "use step";
    try {
      const categories = await getCategories();
      return {
        count: categories.length,
        categories: categories.map((c) => ({
          slug: c.slug,
          name: c.name,
          productCount: c.productCount,
        })),
      };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { count: 0, categories: [], error: message };
    }
  },
});

export const searchProducts = tool({
  description: `Search the Vercel swag store product catalog. Use this for broad discovery, recommendations, and category-based browsing. If the user asks for a specific product by name or wants full details about a single item, use getProductDetails instead.`,
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe(
        `Optional, free-text search terms describing what the user is looking for, e.g. 'hoodie' or 'water bottle'.`,
      ),
    category: z
      .string()
      .optional()
      .describe(
        `Optional category slug to filter results. Only set this when the user clearly wants a specific category. Use the getAllCategories tool to get all valid categories.`,
      ),
  }),
  execute: async ({ query, category }) => {
    "use step";
    try {
      const products = await getProducts({
        search: query,
        category,
        limit: 10,
      });
      return {
        count: products.length,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.images[0],
          price: p.price,
          currency: p.currency,
          category: p.category,
          description: p.description,
        })),
      };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { count: 0, products: [], error: message };
    }
  },
});

export const getProductDetails = tool({
  description: `Fetch full details for a single product by ID or slug. Use this when the user asks about a specific product and you can identify the exact item by its ID or slug. If the user requests a named product but you do not know the exact ID or slug, search with searchProducts first and then call getProductDetails for the matched item. This returns the complete product record with all images, tags, category, description, price, currency, and live stock information so the UI can show a product card directly.`,
  inputSchema: z.object({
    idOrSlug: z
      .string()
      .describe(
        `The product ID or slug for the exact item the user wants details for, e.g. 'black-hoodie' or '12345'.`,
      ),
  }),
  execute: async ({ idOrSlug }) => {
    "use step";
    try {
      const product = await getProductById(idOrSlug);
      let stock;
      try {
        stock = await getProductStock(idOrSlug);
      } catch {
        stock = undefined;
      }

      return {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          currency: product.currency,
          category: product.category,
          images: product.images,
          featured: product.featured,
          tags: product.tags,
          createdAt: product.createdAt,
        },
        stock: stock ?? null,
      };
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Unknown error";
      return { error: message };
    }
  },
});

export const returnOrder = tool({
  description: `File a return for one of the user's past orders. The user must provide an order ID and a reason. Example order IDs: 11111, 22222, 33333.`,
  inputSchema: z.object({
    orderId: z
      .string()
      .describe("The order ID the user wants to return."),
    reason: z
      .string()
      .min(10)
      .max(500)
      .describe("Why the user is returning the order."),
  }),
  execute: async ({ orderId, reason }) => {
    "use step";
    const run = await start(returnFlow, [orderId, reason]);
    return {
      runId: run.runId,
      message: `Return request received for order ${orderId}.`,
    };
  },
});

