import React from "react";

interface SearchInfo {
  stages: string[];
  query?: string;
  urls?: (string | object)[];
  error?: string;
}

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  type: string;
  isLoading?: boolean;
  searchInfo?: SearchInfo;
}

const SearchStages: React.FC<{ searchInfo: SearchInfo }> = ({ searchInfo }) => {
  if (!searchInfo || !searchInfo.stages || searchInfo.stages.length === 0)
    return null;

  return (
    <div className="text-black py-2 font-mono">
      <div className="space-y-1">
        {/* Searching Stage */}
        <div className="flex">
          <span className="mr-3">
            {searchInfo.stages.includes("searching") ? "[✓]" : "[ ]"}
          </span>
          <span
            className={
              searchInfo.stages.includes("searching") &&
              !searchInfo.stages.includes("reading")
                ? "animate-pulse"
                : ""
            }
          >
            Searching the web
          </span>
        </div>

        {/* Show query if searching */}
        {searchInfo.stages.includes("searching") && searchInfo.query && (
          <div className="ml-6 text-sm text-gray-900">
            {">"} {searchInfo.query}
          </div>
        )}

        {/* Reading Stage */}
        <div className="flex">
          <span className="mr-2">
            {searchInfo.stages.includes("reading")
              ? searchInfo.stages.includes("writing")
                ? "[✓]"
                : "[●]"
              : "[ ]"}
          </span>
          <span
            className={
              searchInfo.stages.includes("reading") &&
              !searchInfo.stages.includes("writing")
                ? "animate-pulse"
                : ""
            }
          >
            Reading
          </span>
        </div>

        {/* Show URLs if reading */}
        {searchInfo.stages.includes("reading") &&
          searchInfo.urls &&
          searchInfo.urls.length > 0 && (
            <div className="ml-6 text-sm text-indigo-700 space-y-0.5">
              {Array.isArray(searchInfo.urls) ? (
                searchInfo.urls.slice(0, 3).map((url, index) => (
                  <div key={index}>
                    🌐{" "}
                    {typeof url === "string" ? (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url.substring(0, 40)}...
                      </a>
                    ) : (
                      <a
                        href={JSON.stringify(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {JSON.stringify(url).substring(0, 40)}...
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div>
                  🌐{" "}
                  <a
                    href={String(searchInfo.urls)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {String(searchInfo.urls).substring(0, 40)}...
                  </a>
                </div>
              )}
            </div>
          )}

        {/* Writing Stage */}
        <div className="flex">
          <span className="mr-2">
            {searchInfo.stages.includes("writing") ? "[●]" : "[ ]"}
          </span>
          Writing answer
        </div>

        {/* Error Stage */}
        {searchInfo.stages.includes("error") && (
          <div>
            <div className="flex">
              <span className="mr-2 text-red-400">[✗]</span>
              <span className="text-red-400">Search error</span>
            </div>
            <div className="ml-6 text-xs text-red-300">
              {">"} {searchInfo.error || "An error occurred during search."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageArea: React.FC<{ messages: Message[] }> = ({ messages }) => {
  return (
    <div
      className="flex-grow px-4 overflow-y-auto align-middle"
      style={{ minHeight: 0 }}
    >
      <div>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            } mb-5`}
          >
            <div className="flex flex-col max-w-3/4 break-words overflow-visible">
              {!message.isUser && message.searchInfo && (
                <SearchStages searchInfo={message.searchInfo} />
              )}

              <div
                className={`py-3 px-5 ${
                  message.isUser ? "rightChat" : "leftChat"
                }`}
              >
                {message.isLoading ? (
                  <></>
                ) : (
                  message.content || (
                    <span className="text-gray-400 text-xs italic">
                      Waiting for response...
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageArea;
