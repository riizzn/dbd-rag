import { DataAPIClient } from "@datastax/astra-db-ts";
import "dotenv/config";
import { streamText } from "ai";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";

import { google } from '@ai-sdk/google';
const {
  GOOGLE_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env;
const llm = new ChatGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY!,
  model: "gemini-1.5-flash",
  temperature: 0.7,
});
const model = new GoogleGenerativeAIEmbeddings({
  apiKey: GOOGLE_API_KEY!,
  modelName: "text-embedding-004",
});
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { keyspace: ASTRA_DB_NAMESPACE });

export const POST = async (req: Request) => {
  try {
    const { messages } = await req.json();

    console.log("Received messages:", messages);

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    console.log("Last message:", lastMessage);

    let messageContent = "";
    if (lastMessage?.content) {
      messageContent = lastMessage.content;
    } else if (lastMessage?.parts) {
      const textParts = lastMessage.parts
        .filter(part => part.type === "text")
        .map(part => part.text);
      messageContent = textParts.join(" ");
    }

    if (!messageContent.trim()) {
      return new Response(
        JSON.stringify({ error: "Empty message content" }),
        { status: 400 }
      );
    }

    console.log("Message content to embed:", messageContent);

    const embedding = await model.embedQuery(messageContent);

    let docContext = "";
    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION!);
      const cursor = await collection.find(
        {},
        {
          sort: { $vector: embedding },
          limit: 10,
        }
      );
      const documents = await cursor.toArray();
      const docsMap = documents.map((doc) => doc.content || doc.text);
      docContext = docsMap.filter(Boolean).join("\n\n");
    } catch (error) {
      console.log("Error querying db:", error);
      docContext = "";
    }

    const systemPrompt = `You are a strategy guide for *Dead by Daylight*.  
Your role is to provide clear, accurate tips for improving gameplay as a killer or survivor.  

Use the context to back up your advice, but if the context lacks relevant info, use your own DBD knowledge.  

When answering:  
- Suggest perk builds and explain how they synergize.  
- Provide both beginner-friendly advice and advanced strategies.  
- Break down mechanics like looping, map control, stealth, and pressure.  
- Give practical, actionable recommendations players can use in their next match.  

Format answers in markdown with lists, bullet points, and sections. Avoid images.  

----------------
START CONTEXT
${docContext}
END CONTEXT
----------------

QUESTION: ${messageContent}
----------------`;

    // ✅ Correct streaming with new docs
    const response = await streamText({
      model: google('gemini-2.5-flash'),
       // use AI SDK provider model
      system: systemPrompt,
      messages: [
        { role: "user", content: messageContent },
      ],
    });

    return response.toTextStreamResponse();

  } catch (err) {
    console.error("Full error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
};