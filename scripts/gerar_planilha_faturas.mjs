import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const [, , csvPath, outputPath] = process.argv;

if (!csvPath || !outputPath) {
  console.error("Uso: node gerar_planilha_faturas.mjs <csv> <saida.xlsx>");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { Workbook, SpreadsheetFile } = require("@oai/artifact-tool");

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function columnLetterFromIndex(index) {
  let current = index;
  let result = "";

  while (current >= 0) {
    result = String.fromCharCode((current % 26) + 65) + result;
    current = Math.floor(current / 26) - 1;
  }

  return result;
}

const csvText = await fs.readFile(csvPath, "utf8");
const workbook = await Workbook.fromCSV(csvText, { sheetName: "Faturas" });
const dados = workbook.worksheets.getItem("Faturas");
const usedRange = dados.getUsedRange();
const rows = usedRange.values;

if (!rows || rows.length < 2) {
  console.error("CSV sem dados suficientes para montar a planilha.");
  process.exit(1);
}

const [headers, ...rawDataRows] = rows;
const dataRows = rawDataRows.filter((row) => row.some((cell) => `${cell ?? ""}`.trim() !== ""));
const normalizedDataRows = dataRows.map((row) =>
  headers.map((_, index) => {
    const value = row[index];
    return value ?? "";
  }),
);
const lastColumnLetter = columnLetterFromIndex(headers.length - 1);
const valorIndex = headers.indexOf("valor");
const empresaIndex = headers.indexOf("empresa");
const emissaoIndex = headers.indexOf("emissao");
const vencimentoIndex = headers.indexOf("vencimento");
const arquivoIndex = headers.indexOf("arquivo");

const totalFaturas = normalizedDataRows.length;
const valorTotal = normalizedDataRows.reduce((sum, row) => sum + toNumber(row[valorIndex]), 0);
const empresasUnicas = new Set(normalizedDataRows.map((row) => row[empresaIndex]).filter(Boolean)).size;

dados.getRangeByIndexes(0, 0, normalizedDataRows.length + 1, headers.length).values = [
  headers,
  ...normalizedDataRows,
];

const resumo = workbook.worksheets.add("Resumo");

resumo.getRange("A1:D1").merge();
resumo.getRange("A1").values = [["Resumo de Faturas"]];
resumo.getRange("A1").format = {
  fill: "#1F4E78",
  font: { bold: true, color: "#FFFFFF", size: 16 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};

resumo.getRange("A3:B6").values = [
  ["Indicador", "Valor"],
  ["Total de faturas", totalFaturas],
  ["Valor total", valorTotal],
  ["Empresas unicas", empresasUnicas],
];

resumo.getRange("A3:B3").format = {
  fill: "#D9EAF7",
  font: { bold: true, color: "#12344D" },
  horizontalAlignment: "center",
};
resumo.getRange("B4").format.numberFormat = "0";
resumo.getRange("B5").format.numberFormat = "R$ #,##0.00";
resumo.getRange("A3:B6").format.wrapText = true;
resumo.freezePanes.freezeRows(3);
resumo.getRange("A:A").format.columnWidthPx = 180;
resumo.getRange("B:B").format.columnWidthPx = 140;
dados.getRangeByIndexes(0, 0, 1, headers.length).format = {
  fill: "#1F4E78",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
dados.freezePanes.freezeRows(1);
dados.showGridLines = false;

if (valorIndex >= 0) {
  const valorValues = normalizedDataRows.map((row) => [toNumber(row[valorIndex])]);
  dados.getRangeByIndexes(1, valorIndex, normalizedDataRows.length, 1).values = valorValues;
  dados.getRangeByIndexes(1, valorIndex, normalizedDataRows.length, 1).format.numberFormat = "R$ #,##0.00";
}

if (emissaoIndex >= 0) {
  const emissaoValues = normalizedDataRows.map((row) => [new Date(`${row[emissaoIndex]}T00:00:00`)]);
  dados.getRangeByIndexes(1, emissaoIndex, normalizedDataRows.length, 1).values = emissaoValues;
  dados.getRangeByIndexes(1, emissaoIndex, normalizedDataRows.length, 1).format.numberFormat = "yyyy-mm-dd";
}

if (vencimentoIndex >= 0) {
  const vencimentoValues = normalizedDataRows.map((row) => [new Date(`${row[vencimentoIndex]}T00:00:00`)]);
  dados.getRangeByIndexes(1, vencimentoIndex, normalizedDataRows.length, 1).values = vencimentoValues;
  dados.getRangeByIndexes(1, vencimentoIndex, normalizedDataRows.length, 1).format.numberFormat = "yyyy-mm-dd";
}

dados.getRange(`A1:${lastColumnLetter}${normalizedDataRows.length + 1}`).format.wrapText = true;
dados.getRange("A:A").format.columnWidthPx = 180;
dados.getRange("B:B").format.columnWidthPx = 150;

if (emissaoIndex >= 0) {
  dados.getRangeByIndexes(0, emissaoIndex, normalizedDataRows.length + 1, 1).format.columnWidthPx = 110;
}

if (vencimentoIndex >= 0) {
  dados.getRangeByIndexes(0, vencimentoIndex, normalizedDataRows.length + 1, 1).format.columnWidthPx = 110;
}

if (valorIndex >= 0) {
  dados.getRangeByIndexes(0, valorIndex, normalizedDataRows.length + 1, 1).format.columnWidthPx = 110;
}

if (headers.includes("descricao")) {
  const descricaoIndex = headers.indexOf("descricao");
  dados.getRangeByIndexes(0, descricaoIndex, normalizedDataRows.length + 1, 1).format.columnWidthPx = 420;
}

if (arquivoIndex >= 0) {
  dados.getRangeByIndexes(0, arquivoIndex, normalizedDataRows.length + 1, 1).format.columnWidthPx = 180;
}

dados.tables.add(`A1:${lastColumnLetter}${normalizedDataRows.length + 1}`, true, "FaturasTable");

const checkResumo = await workbook.inspect({
  kind: "table",
  range: "Resumo!A1:B6",
  include: "values,formulas",
  tableMaxRows: 6,
  tableMaxCols: 4,
});
console.log(checkResumo.ndjson);

const checkDados = await workbook.inspect({
  kind: "table",
  range: `Faturas!A1:${lastColumnLetter}${Math.min(normalizedDataRows.length + 1, 8)}`,
  include: "values,formulas",
  tableMaxRows: 8,
  tableMaxCols: headers.length,
});
console.log(checkDados.ndjson);

await workbook.render({ sheetName: "Resumo", range: "A1:B6", scale: 2, format: "png" });
await workbook.render({
  sheetName: "Faturas",
  range: `A1:${lastColumnLetter}${Math.min(normalizedDataRows.length + 1, 8)}`,
  scale: 1,
  format: "png",
});

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
