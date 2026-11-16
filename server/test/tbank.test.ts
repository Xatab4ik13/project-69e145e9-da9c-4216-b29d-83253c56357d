import { expect, test } from "bun:test";
import { tbankToken } from "../src/tbank";

test("подпись Т-Банка: пример из документации", () => {
  // Пример из https://www.tbank.ru/kassa/dev/payments/#section/Podpis-zaprosa
  const token = tbankToken({ TerminalKey: "MerchantTerminalKey", Amount: 19200, OrderId: "21090", Description: "Подарочная карта на 1000 рублей", DATA: { Phone: "x" }, Receipt: { a: 1 } }, "usaf8fw8fsw21g");
  expect(token).toBe("0024a00af7c350a3a67ca168ce06502aa72772456662e38696d48b56ee9c97d9");
});

test("Token и вложенные объекты в подпись не входят", () => {
  const a = tbankToken({ TerminalKey: "T", Amount: 100 }, "p");
  expect(tbankToken({ TerminalKey: "T", Amount: 100, Token: "zzz", Receipt: { x: 1 } }, "p")).toBe(a);
});
