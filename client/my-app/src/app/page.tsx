"use client";

import InputBar from "@/components/inputbox";
import MessageArea from "@/components/messageArea";
import { Content } from "next/font/google";
import React, { useState } from "react";
const ChatScreen = ({}) => {
  interface SearchInfo {
    stages: string[];
    query: string;
    urls: string[];
  }
  interface Message {
    id: number;
    content: string;
    isUser: boolean;
    type: string;
    isLoading?: boolean;
    searchInfo?: SearchInfo;
  }
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hi there, how can I help you?",
      isUser: false,
      type: "message",
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [checkpointId, setCheckpointId] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newMessageId =
      messages.length > 0 ? Math.max(...messages.map((msg) => msg.id)) + 1 : 1;

    setMessages((prev) => [
      ...prev,
      {
        id: newMessageId,
        content: currentMessage,
        isUser: true,
        type: "message",
      },
    ]);
    const userInput = currentMessage;
    setCurrentMessage("");

    try {
      const aiResponseId = newMessageId + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: aiResponseId,
          content: "",
          isUser: false,
          type: "message",
          isLoading: true,
          searchInfo: {
            stages: [],
            query: "",
            urls: [],
          },
        },
      ]);

      let url = `http://127.0.0.1:8000/chat_stream/${encodeURIComponent(
        userInput
      )}`;

      if (checkpointId) {
        url += `?checkpoint_id=${encodeURIComponent(checkpointId)}`;
        console.log("the checkpoint id :", checkpointId, "\n url :", url);
      }

      // Connect to SSE endpoint using EventSource
      const eventSource = new EventSource(url);
      let streamedContent = "";
      let searchData = null;
      let hasReceivedContent = false;
      // Process incoming messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "checkpoint") {
            // Store the checkpoint ID for future requests
            setCheckpointId(data.checkpoint_id);
          } else if (data.type === "content") {
            streamedContent += data.content;
            hasReceivedContent = true;

            // Update message with accumulated content
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiResponseId
                  ? { ...msg, content: streamedContent, isLoading: false }
                  : msg
              )
            );
          } else if (data.type === "search_start") {
            // Create search info with 'searching' stage
            const newSearchInfo = {
              stages: ["searching"],
              query: data.query,
              urls: [],
            };
            searchData = newSearchInfo;

            // Update the AI message with search info
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiResponseId
                  ? {
                      ...msg,
                      content: streamedContent,
                      searchInfo: newSearchInfo,
                      isLoading: false,
                    }
                  : msg
              )
            );
          } else if (data.type === "search_results") {
            try {
              // Parse URLs from search results
              const urls =
                typeof data.urls === "string"
                  ? JSON.parse(data.urls)
                  : data.urls;

              // Update search info to add 'reading' stage (don't replace 'searching')
              const newSearchInfo = {
                stages: searchData
                  ? [...searchData.stages, "reading"]
                  : ["reading"],
                query: searchData?.query || "",
                urls: urls,
              };
              searchData = newSearchInfo;

              // Update the AI message with search info
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiResponseId
                    ? {
                        ...msg,
                        content: streamedContent,
                        searchInfo: newSearchInfo,
                        isLoading: false,
                      }
                    : msg
                )
              );
            } catch (err) {
              console.error("Error parsing search results:", err);
            }
          } else if (data.type === "search_error") {
            // Handle search error
            const newSearchInfo = {
              stages: searchData ? [...searchData.stages, "error"] : ["error"],
              query: searchData?.query || "",
              error: data.error,
              urls: [],
            };
            searchData = newSearchInfo;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiResponseId
                  ? {
                      ...msg,
                      content: streamedContent,
                      searchInfo: newSearchInfo,
                      isLoading: false,
                    }
                  : msg
              )
            );
          } else if (data.type === "end") {
            // When stream ends, add 'writing' stage if we had search info
            if (searchData) {
              const finalSearchInfo = {
                ...searchData,
                stages: [...searchData.stages, "writing"],
              };

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiResponseId
                    ? { ...msg, searchInfo: finalSearchInfo, isLoading: false }
                    : msg
                )
              );
            }

            eventSource.close();
          }
        } catch (error) {
          console.error("Error parsing event data:", error, event.data);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();

        // Only update with error if we don't have content yet
        if (!streamedContent) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiResponseId
                ? {
                    ...msg,
                    content:
                      "Sorry, there was an error processing your request.",
                    isLoading: false,
                  }
                : msg
            )
          );
        }
      };

      // Listen for end event
      eventSource.addEventListener("end", () => {
        eventSource.close();
      });
    } catch (error) {
      console.error("Error setting up EventSource:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: newMessageId + 1,
          content: "Sorry, there was an error connecting to the server.",
          isUser: false,
          type: "message",
          isLoading: false,
        },
      ]);
    }
  };
  return (
    <div className="    flex justify-center p-10  h-full overflow-hidden">
      <div className={" w-full  p-10 flex flex-col   overflow-hidden  max-w-300"}>
        
        <MessageArea messages={messages} />
        <InputBar
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default function Home() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="h-screen p-10 bg-white flex">
      <div className="h-full rounded-3xl w-full   flex">
        <div className="brand  absolute bg-white p-2  pr-9   font-bold text-6xl z-50 pb-4 rounded-br-2xl">
          SearchGroq
        </div>

        <div
          className={` transition-all bg-white rounded-2xl duration-300 ${
            expanded ? "w-0" : "w-1/2"
          }`}
        ></div>
        <div
          className={`bg-black rounded-2xl transition-all duration-300  ${
            expanded ? "w-full" : "w-1/2"
          }`}
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="relative top-1/2 -translate-y-1/2 left-0 transform -translate-x-1/2 z-10  bg-white rounded-full border-4 border-black   cursor-pointer h-10 w-10 justify-center items-center  font-black "
          >
            {expanded ? ">" : "<"}
          </button>
          <ChatScreen />
        </div>
      </div>
    </div>
  );
}
