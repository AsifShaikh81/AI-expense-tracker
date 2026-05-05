import { ChatGroq } from "@langchain/groq";
import { MemorySaver, MessagesAnnotation, StateGraph, type LangGraphRunnableConfig } from "@langchain/langgraph";
import { initDB } from "./db.ts";
import { initTools } from "./tool.ts";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage, ToolMessage } from "langchain";
import type { StreamMessage } from "./type.ts";

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
      content: `Always use ₹ (Indian Rupee) symbol for all amounts, never use $ or USD.

      You are a helpful expense tracking assistant. Current datetime: ${new Date().toISOString()}.
      Call add_expense tool to add the expense to database.
      Call get_expenses tool to get the list of expenses for given date range.
      Call generate_expense_chart tool only when user needs to visualize the expenses.

      When generating charts, follow these rules strictly:
      - Default groupBy is always "date" unless user specifies otherwise
      - Use "week" only if user says "weekly" or "by week"
      - Use "month" only if user says "monthly" or "by month"
      - Default date range: from = 30 days ago, to = today
      
      `,
    },
    ...state.messages,
  ]);
  return {
    messages: [response],
  };
}

// *conditional edge
function shouldContinue1(state:typeof MessagesAnnotation.State,
    config: LangGraphRunnableConfig

){
    const messages = state.messages
    const lastMessages = messages.at(-1) as AIMessage
    if(lastMessages.tool_calls?.length){
      //* send custom event
      const customMessage: StreamMessage = {
        type:'toolCall:start',
        payload:{
          name:lastMessages.tool_calls[0]?.name,
          args:lastMessages.tool_calls[0]?.args
        }
      }
      config.writer(customMessage)
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

export const agent = graph.compile({
    checkpointer: new MemorySaver()
})

/* async function main() {
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
} */

// main()