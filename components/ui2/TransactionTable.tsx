"use client";
import {
  filterTransactions,
  FilterTransactionsParams,
} from "@/app/actions/searchTransactions";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TransactionDetail from "@/components/ui2/TransactionDetail";
import { formatVnd } from "@/lib/utils";
import { Bank, Transaction } from "@prisma/client";
import { format } from "date-fns";
import { ArrowRight, Settings } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import TransactionFilter from "./TransactionFilter";

const highlightFilter = (text: string, filter: string) => {
  if (!filter) return text;
  return text.replace(
    new RegExp(filter, "gi"),
    (match) => `<mark>${match}</mark>`
  );
};

const bankImageMap = {
  [Bank.VCB]: "vcb.jpeg",
  [Bank.VietinBank]: "vietinbank.png",
};

export default function TransactionTable({
  serverTransactions,
  totalCount = 0,
  children,
}: {
  serverTransactions: Transaction[];
  totalCount?: number;
  children?: React.ReactNode;
}) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(serverTransactions);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [filter, setFilter] = useState<FilterTransactionsParams>({
    nameFilter: "",
    amount: undefined,
    sortConfig: { key: "date", direction: "asc" },
    currentPage: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sheetOpened, setSheetOpened] = useState(false);

  useEffect(() => {
    (async () => {
      setSheetOpened(false);
      setIsLoading(true);
      const result = await filterTransactions({ ...filter });
      setTransactions(result);
      setIsLoading(false);
    })();
  }, [filter]);

  const loadMore = () => {
    setFilter({ ...filter, currentPage: (filter.currentPage || 1) + 1 });
  };

  return (
    <>
      <Sheet open={sheetOpened} onOpenChange={setSheetOpened}>
        <SheetTrigger asChild>
          <Button
            size={"icon"}
            className="fixed bottom-4 right-4 md:hidden z-50"
          >
            <Settings />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <TransactionFilter
            filter={filter}
            onFilterChange={setFilter}
            totalCount={totalCount}
          >
            {children}
          </TransactionFilter>
        </SheetContent>
      </Sheet>
      <div className="flex">
        <div className="hidden md:block w-1/4 space-y-4 pr-4 border-r sticky top-0 left-0">
          <TransactionFilter
            filter={filter}
            onFilterChange={setFilter}
            totalCount={totalCount}
          >
            {children}
          </TransactionFilter>
        </div>
        <div className="md:w-3/4 md:pl-4 w-full max-w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Ngày</TableHead>
                <TableHead className="min-w-24 md:min-w-36 text-right">
                  Số tiền quyên góp
                </TableHead>
                <TableHead>Nội dung chi tiết</TableHead>
                <TableHead>NH</TableHead>
                <TableHead className="text-right">Trang</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5} className="text-center">
                      <Skeleton className="w-full h-6" />
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Không có kết quả nào
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction, index) => (
                  <TableRow
                    key={index}
                    onClick={() => setSelectedTransaction(transaction)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <TableCell>{format(transaction.date, "dd/MM")}</TableCell>
                    <TableCell className="text-right">
                      {formatVnd(transaction.creditAmount)}
                    </TableCell>
                    <TableCell>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: filter.nameFilter
                            ? highlightFilter(
                                transaction.description,
                                filter.nameFilter
                              )
                            : transaction.description,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Image
                        src={`/images/bank/${bankImageMap[transaction.bank]}`}
                        alt={transaction.bank}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatVnd(transaction.pageNumber)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {transactions.length === 20 && (
            <Button
              onClick={loadMore}
              className="my-4 ml-auto"
              disabled={isLoading}
            >
              Trang kế tiếp <ArrowRight size={16} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
      <TransactionDetail
        selectedTransaction={selectedTransaction}
        setSelectedTransaction={setSelectedTransaction}
      />
    </>
  );
}
