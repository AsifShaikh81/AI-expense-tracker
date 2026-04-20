import { ChatGroq } from "@langchain/groq";
import {MessagesAnnotation} from '@langchain/langgraph'
const model = new ChatGroq({
model: "llama-3.3-70b-versatile",
temperature: 0
});


await model.invoke("Hello, world!")

async function callModel(state:typeof MessagesAnnotation) {
    
}