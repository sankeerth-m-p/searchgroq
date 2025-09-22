import { useState } from "react";

const InputBar = ({ currentMessage, setCurrentMessage, onSubmit }) => {
  const handleChange = (e) => {
    setCurrentMessage(e.target.value);
  };
  return (
    <form onSubmit={onSubmit} className=" ">
      <div className="flex items-center rounded-3xl p-3 px-6 justify-between  border-white text-white border-4">
        <input
          type="text"
          placeholder="Type a message"
          value={currentMessage}
          onChange={handleChange}
          className="flex-grow px-2 py-2  focus:outline-none text-white"
        />

        <button
          type="submit"
          className="bg-gradient-to-r from-gray-50 to-gray-300 text-black hover:from-white hover:to-gray-50 rounded-full px-3 py-2 ml-2 shadow-md transition-all duration-200 group"
        >
          send
        </button>
      </div>
    </form>
  );
};
export default InputBar;
