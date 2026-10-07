import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useFinance } from "../entities/finance/model/use-finance";
import { summarizeMonth } from "../entities/finance/model/summary";
import BudgetCard from "../entities/finance/ui/BudgetCard";
import BudgetEditor from "../features/set-budget/BudgetEditor";
import { isValidMonth, localDate } from "../shared/lib/date";
import AsyncContent from "../shared/ui/AsyncContent";
import EmptyState from "../shared/ui/EmptyState";
import DeleteButton from "../shared/ui/DeleteButton";

export default function BudgetsPage() {
  const { state, retry, saveBudget, deleteBudget } = useFinance();
  const [month, setMonth] = useState(() => localDate().slice(0, 7));
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Бюджеты</Typography>
        <Typography color="text.secondary">
          Месячные лимиты расходов по категориям
        </Typography>
      </Box>
      <AsyncContent state={state} onRetry={retry}>
        {({ transactions, budgets, categories }) => (
          <>
            <BudgetEditor
              categories={categories
                .filter((item) => item.type === "expense")
                .map((item) => item.name)}
              categoryRecords={categories}
              month={month}
              onMonthChange={setMonth}
              onSave={saveBudget}
            />
            {isValidMonth(month) && (
              <>
                {!Object.keys(budgets[month] ?? {}).length && (
                  <EmptyState
                    title="Бюджеты на этот месяц не заданы"
                    description="Выберите категорию и сохраните лимит в форме выше. Расходы уже учитываются в карточках."
                  />
                )}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  {summarizeMonth(
                    transactions,
                    month,
                    categories
                      .filter((item) => item.type === "expense")
                      .map((item) => item.name),
                  ).byCategory.map(({ category, amount }) => (
                    <BudgetCard
                      key={category}
                      category={category}
                      spent={amount}
                      limit={budgets[month]?.[category]}
                      actions={
                        budgets[month]?.[category] !== undefined && (
                          <DeleteButton
                            label="Удалить лимит"
                            title="Удалить лимит?"
                            description={`Лимит категории «${category}» за ${month} будет удалён. Операции сохранятся.`}
                            onDelete={() => deleteBudget(month, category)}
                          />
                        )
                      }
                    />
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </AsyncContent>
    </Stack>
  );
}
