"use client";

import dbdlogo from "./assets/dbdlogo.png";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import PromptRow from "./components/PromptRow";
import LoadingBubble from "./components/LoadingBubble";
import { UIMessage } from "@ai-sdk/react";
import Bubble from "./components/Bubble";
const Home = () => {
  const { messages, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  //this is for the prompt suggestion row
  const handlePrompt = (prompt: string) => {
    const msg: UIMessage = {
      id: crypto.randomUUID(),

      role: "user",
      parts: [
        {
          type: "text",
          text: prompt,
          state: "done",
        },
      ],
    };
    sendMessage(msg);
  };

  const noMessage = !messages || messages.length===0;
  return (
    <main className="flex flex-col items-center justify-between  ">
      <Image src={dbdlogo} width={200} height={200} alt="DBD-logo" />
      <section
        className={` ${
          noMessage
            ? ""
            : "w-full max-w-2xl h-[200px] bg-white/5 mx-auto mt-10 p-5 border border-gray-800 rounded-2xl shadow-md overflow-y-auto space-y-3 "
        }`}
      >
        {noMessage ? (
          <>
            <p className="text-center">
              The ultimate place for Dead by Daylight fans! Discover killers,
              survivors, perks, and everything you need to master the Fog.
            </p>
            <br />
            <PromptRow onPromptClick={handlePrompt} />
          </>
        ) : (
          <>
            {loading && <LoadingBubble />}
            {messages.map((c, i) => (
              <div className="flex flex-col" key={i}>
              <Bubble key={i}  message={c}/>
              </div>
            ))}
          </>
        )}
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput("");
              setLoading(true);
            }
          }}
          className=" flex justify-between gap-5 items-center w-full max-w-2xl mx-auto mt-20 bg-white h-14 rounded-2xl p-5"
        >
          <input
            type="string"
            value={input}
            placeholder="Ask me something"
            onChange={(e) => setInput(e.target.value)}
            className="text-black w-full outline-none bg-transparent placeholder-gray-400 flex-1"
          />
          <button
            type="submit"
            className="bg-black text-white text-sm font-medium rounded-2xl px-4 py-2 cursor-pointer"
          >
            Submit
          </button>
        </form>
      </section>
    </main>
  );
};

export default Home;
