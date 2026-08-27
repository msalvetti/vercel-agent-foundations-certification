"use client";

/**
 * Welcome! This is the chat panel you will edit for the workshop!
 *
 * During the workshop you'll connect it to a real agent: swap the
 * local `useState` for `useChat` from the AI SDK, point the form
 * at `sendMessage`, and render each message's `parts` inside
 * `<ConversationContent>`.
 *
 * Workshop docs: https://agent-foundations-certification.vercel.app/docs/admin-chat-agent
 */
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "./ai-elements/message";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const SUGGESTIONS = [
  "Show me low-stock items",
  "What were yesterday's top sellers?",
  "Summarize this week's revenue",
];

export function AdminAgentChat() {
  const [input, setInput] = useState("");

  const { messages, error, sendMessage, status, stop } = useChat({
    // we need to point to a different API route because this is a different agent
    transport: new DefaultChatTransport({ api: "/api/admin/chat" }),
  });

  const isGenerating = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isGenerating) return;
    sendMessage({ text });
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isGenerating) return;
    sendMessage({ text: suggestion });
  };

  if (error) return <div>{error.message}</div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((m) =>
            m.parts.map((p, i) => {
              switch (p.type) {
                case "text":
                  return (
                    <Message key={`${m.id}-${i}`} from={m.role}>
                      <MessageContent>
                        <MessageResponse>{p.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  );
                default:
                  return null;
              }
            }),
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="flex flex-col gap-3 border-t p-3">
        <Suggestions>
          {SUGGESTIONS.map((s) => (
            <Suggestion
              key={s}
              suggestion={s}
              onClick={handleSuggestionClick}
            />
          ))}
        </Suggestions>
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Ask the admin agent…"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              status={status}
              onStop={stop}
              disabled={!isGenerating && !input.trim()}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
