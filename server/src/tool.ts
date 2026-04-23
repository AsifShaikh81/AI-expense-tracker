import { tool } from "langchain";
import z from "zod";

import { Database } from "bun:sqlite";

export function initTools(database: Database) {
  // * add Expense
  const addExpense = tool(
    ({ title, amount }) => {
      console.log({ title, amount });
      const date = new Date().toISOString().split("T")[0];
      const statement = database.prepare(
        `INSERT INTO expenses (title,amount, date)VALUES (?,?,?)`,
      );

      statement.run(title, amount, date);
      return JSON.stringify({ status: "success" });
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
  // * get expense
  const getExpense = tool(
    ({ from, to }) => {
      console.log({ from, to });
      const stmt = database.prepare(
        `select * from expenses where date BETWEEN ? and ?`,
      );
      const rows = stmt.all(from, to);
      // console.log("Rows", rows);
      // console.log(JSON.stringify(rows,null,2))

      return JSON.stringify({ status: "success" });
    },

    {
      name: "get_expenses",
      description: "get the expenses from database for   the given range",
      schema: z.object({
        from: z.string().describe("start date of expense in YYYY-MM-DD format"),
        to: z.string().describe("end date of expense in YYYY-MM-DD format"),
      }),
    },
  );
  return [addExpense, getExpense];
}
