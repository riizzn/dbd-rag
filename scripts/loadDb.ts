import { DataAPIClient } from "@datastax/astra-db-ts";
import "dotenv/config";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const {
  GOOGLE_API_KEY,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

// const llm = new ChatGoogleGenerativeAI({
//   apiKey: GOOGLE_API_KEY!,
//   model: "gemini-1.5-flash",
//   temperature: 0.7,
// });
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: GOOGLE_API_KEY!,
  modelName: "text-embedding-004",
});

const dbdData = [
  "https://en.wikipedia.org/wiki/Dead_by_Daylight",
  "https://deadbydaylight.wiki.gg/wiki/William_Afton",
  "https://deadbydaylight.wiki.gg/wiki/Dracula",
  "https://deadbydaylight.wiki.gg/wiki/Killers",
  "https://deadbydaylight.wiki.gg/wiki/Survivors",
  "https://deadbydaylight.wiki.gg/wiki/Perks",
  "https://deadbydaylight.wiki.gg/wiki/Realms",

];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { keyspace: ASTRA_DB_NAMESPACE });
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 524,
  chunkOverlap: 100,
});

const createCollection = async (
  SimilarityMetric: SimilarityMetric = "cosine"
) => {
  const collection = await db.createCollection(ASTRA_DB_COLLECTION!, {
    vector: { dimension: 768, metric: SimilarityMetric },
  });
  console.log(collection);
};
const loadData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION!);
  for await (const url of dbdData) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content!);
    const chunkEmbeddings = await embeddings.embedDocuments(chunks);
    //This loop is crucial because it aligns the data for storage. A vector database like Astra DB needs both the original text content (the chunk) and its numerical vector representation (the embedding) to be stored together. The loop ensures you have the correct pair for each piece of data you want to save.
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = chunkEmbeddings[i];
      await collection.insertOne({
        $vector: embedding,
        text: chunk,
      });
      console.log(`succesfully embeded and inserted chunk ${i} from ${url}`);
    }
  }
  console.log("All data successfully loaded into the collection!");
};
const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });
  return (await loader.scrape())?.replace(/<[^>]*>?/gm,'')
};
createCollection().then(()=>loadData())