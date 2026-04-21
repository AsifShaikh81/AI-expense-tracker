import { tool } from "langchain";
import z from "zod";

import { Database } from "bun:sqlite";

export function initTools(database:Database){
const addExpense = tool(
  ({ title, amount }) => {
    console.log({ title, amount });
    const date = new Date().toISOString().split('T')[0]
    const statement = database.prepare(`INSERT INTO expenses (title,amount, date)VALUES (?,?,?)`)

    statement.run(title,amount,date)
    return JSON.stringify({status:'success'})
  },

  {
    name: "add_expense",
    description: "Add the given expense to database",
    schema: z.object({
      title: z.string().describe("the title"),
      amount: z.number().describe("the amount spent"),
    }),
  },
);
  return [addExpense]
}
