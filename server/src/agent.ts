import { ChatGroq } from "@langchain/groq";
import { MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { initDB } from "./db.ts";
import { initTools } from "./tool.ts";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage, ToolMessage } from "langchain";

// * init database
const database = initDB("./expenses.db");
const tools = initTools(database);

// * init llm
const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
});

// * tool node
const toolNode = new ToolNode(tools);

async function callModel(state: typeof MessagesAnnotation.State) {
  const llmWithTools = model.bindTools(tools);
  const response = await llmWithTools.invoke([
    {
      role: "system",
      content: `You are a helpful expense tracking assistant. Current datetime: ${new Date().toISOString()}.
      Call add_expense tool to add the expense to database.
      Call get_expenses tool to get the list of expenses for given date range.
      Call generate_expense_chart tool only when user needs to visualize the expenses.
      `,
    },
    ...state.messages,
  ]);
  return {
    messages: [response],
  };
}

// *conditional edge
function shouldContinue1(state:typeof MessagesAnnotation.State){
    const messages = state.messages
    const lastMessages = messages.at(-1) as AIMessage
    if(lastMessages.tool_calls?.length){
        return 'tools'
    }

    return '__end__'
}

// *conditional edge
async function shouldCallModel(state:typeof MessagesAnnotation.State) {
  const messagesHistory = state.messages
  const lastMessages = messagesHistory.at(-1) as ToolMessage
  const message = JSON.parse(lastMessages.content as string)

  if(message.type=='chart'){
    return "__end__"
  }

    return "callModel"
}

//* graph 
const graph = new StateGraph(MessagesAnnotation)
.addNode('callModel',callModel)
.addNode('tools',toolNode)
.addEdge("__start__","callModel")
.addConditionalEdges("callModel", shouldContinue1,{
    __end__:'__end__',
    tools:'tools'
})
.addConditionalEdges("tools", shouldCallModel,{
callModel: "callModel",
__end__:"__end__"

})

const agent = graph.compile({
    checkpointer: new MemorySaver()
})

async function main() {
 const config = {configurable:{thread_id:"1"}}
    const response = await agent.invoke({
        messages:[
            {
                role:"user",
                content:'can you visualize how much i have spent this year group by months'
            }
        ]
    },
    config

)
    console.log(JSON.stringify(response, null, 2))
}

main()