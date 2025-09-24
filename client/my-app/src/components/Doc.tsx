import React from 'react';

const LeftSide = () => {
  return (
    <div className="pt-32 px-10 h-full overflow-hidden content-end bottom-0">
      {/* Description Section */}
      <div className="mb-8 retro bg-white">
        <div className="p-6">
          <p className="mb-4">
            A <span className="bg-red-400 text-white px-2 py-1 border-2 border-black font-bold">experimental AI playground</span> that combines ChatGroqs lightning-fast responses with live web search. Built as a learning project to explore AI streaming, tool integration, and memory management.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-8 retro bg-white">
        <div className="p-6">
          <ul className="space-y-4">
            <li className="flex items-center p-3 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="w-8 h-8 bg-red-400 border-2 border-black mr-4 flex items-center justify-center font-bold text-white">
                ⚡
              </div>
              <div>
                <strong>Streaming Responses:</strong> Watch AI thoughts unfold in real-time
              </div>
            </li>
            <li className="flex items-center p-3 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="w-8 h-8 bg-red-400 border-2 border-black mr-4 flex items-center justify-center font-bold text-white">
                🔍
              </div>
              <div>
                <strong>Live Web Search:</strong> Powered by Tavily Search API
              </div>
            </li>
            <li className="flex items-center p-3 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="w-8 h-8 bg-red-400 border-2 border-black mr-4 flex items-center justify-center font-bold text-white">
                🧠
              </div>
              <div>
                <strong>Context Memory:</strong> Remembers your conversation flow
              </div>
            </li>
            <li className="flex items-center p-3 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_#000]">
              <div className="w-8 h-8 bg-red-400 border-2 border-black mr-4 flex items-center justify-center font-bold text-white">
                🎯
              </div>
              <div>
                <strong>Search Transparency:</strong> See exactly when & what it searches
              </div>
            </li>
          </ul>
        </div>
      </div>
     
    </div>
  );
};

export default LeftSide;