import React from "react";
import Psb from "./Psb";

const PromptRow = ({ onPromptClick }: { onPromptClick: (prompt: string) => void }) => {
  const prompts = [
    "What can Dracula do in his Bat Form?",
    "How does Portia Maye’s All-Shaking Thunder perk work?",
    "What maps were added in the 2v8 update?",
    "When does the Antidote item spawn in a Trial?",
  ];
  return (
    <div className="flex flex-wrap  gap-2 justify-center ">
      {prompts.map((p, i) => (
        <Psb prompt={p} key={i} onClick={()=>onPromptClick(p)} />
      ))}
    </div>
  );
};

export default PromptRow;
