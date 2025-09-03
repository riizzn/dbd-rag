import React from "react";
import { UIMessage } from "@ai-sdk/react";

const Bubble = ({ message }: { message: UIMessage }) => {
  const role = message.role;
  const text = message.parts[0]?.type === 'text' ? message.parts[0].text : '';
  return (
    <div>
      {role === "user" ? (
        <div className="self-end bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-br-sm max-w-[75%]">
          {text}
        </div>
      ) : (
        <div className="self-start bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-sm max-w-[75%]">
          {text}
        </div>
      )}
    </div>
  );
};

export default Bubble;
