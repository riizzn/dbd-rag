import React from "react";

const Psb = ({prompt,onClick}:{prompt: string; onClick:()=>void}) => {
  return (
    <button  onClick={onClick} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl max-w-[75%] cursor-pointer">
       
        {prompt}

    </button>
  );
};

export default Psb;
