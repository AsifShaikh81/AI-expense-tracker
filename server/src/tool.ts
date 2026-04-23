import { tool } from "langchain";
import z from "zod";

import { Database } from "bun:sqlite";

export function initTools(database: Database) {
  // * add Expense
  const addExpense = tool(
    ({ title, amount }) => {
      console.log({ title, amount });
      // const date = new Date().toISOString().split("T")[0];
      const date = new Date().toISOString().slice(0,10)
      const statement = database.prepare(
        `INSERT INTO expenses (title,amount, date)VALUES (?,?,?)`,
      );

      statement.run(title, amount,date);
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
  const getExpenses = tool(
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

  //* get chart expenses
    const generateChart = tool(
    ({ from, to, groupBy }) => {
      let sqlGroupBy: string;

      switch (groupBy) {
        case 'month':
          sqlGroupBy = `strftime('%Y-%m', date)`;
          break;

        case 'week':
          sqlGroupBy = `strftime('%Y-W%W', date)`;
          break;

        case 'date':
          sqlGroupBy = `date`;
          break;

        default:
          sqlGroupBy = `strftime('%Y-%m', date)`;
      }

      const query = `
        SELECT ${sqlGroupBy} as period, SUM(amount) as total
        FROM expenses
        WHERE date BETWEEN ? AND ?
        GROUP BY period
        ORDER BY period
      `;

      const stmt = database.prepare(query);
      const rows = stmt.all(from, to);

      const result = rows.map((row) => {
        return {
          [groupBy]: row.period,
          amount: row.total,
        };
      });

      return JSON.stringify({
        type: 'chart',
        data: result,
        labelKey: groupBy,
      });
    },
    {
      name: 'generate_expense_chart',
      description:
        'Generate expense charts by querying the database and grouping expenses by month, week or date',
      schema: z.object({
        from: z
          .string()
          .describe('Start date in YYYY-MM-DD format'),
        to: z
          .string()
          .describe('End date in YYYY-MM-DD format'),
        groupBy: z
          .enum(['month', 'week', 'date'])
          .describe(
            'How to group the data: by month, week or date.'
          ),
      }),
    }
  );
  return [addExpense, getExpenses, generateChart];
}
