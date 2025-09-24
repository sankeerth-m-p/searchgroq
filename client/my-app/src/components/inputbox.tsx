import { useState } from "react";

interface InputBarProps {
  currentMessage: string;
  setCurrentMessage: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const InputBar: React.FC<InputBarProps> = ({ currentMessage, setCurrentMessage, onSubmit }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
  };

  return (
    <form onSubmit={onSubmit} className="">
      <div className="flex items-center p-3 px-6 justify-between retro">
        <input
          type="text"
          placeholder="TYPE HERE"
          value={currentMessage}
          onChange={handleChange}
          className="flex-grow px-2 py-2 focus:outline-none text-black font-bold"
        />
        <button
          type="submit"
          className="text-black border-4 px-3 py-2 ml-2 bg-white hover:transition-all duration-200 group retroPop"
        >
          send
        </button>
      </div>
    </form>
  );
};

export default InputBar;
