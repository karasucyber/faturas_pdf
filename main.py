import json
import os
import re
import subprocess
import sys
from pathlib import Path

import pandas as pd

sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from faturas_pdf.crew import FaturasPdfCrew
from faturas_pdf.tools.leitor_pdf import LeitorPDFTool

BASE_DIR = Path(__file__).resolve().parent
ARQUIVO_CSV = BASE_DIR / "base_faturas.csv"
ARQUIVO_PLANILHA = BASE_DIR / "outputs" / "faturas_consolidadas.xlsx"
BUILDER_PLANILHA = BASE_DIR / "scripts" / "gerar_planilha_faturas.mjs"
NODE_RUNTIME = Path(
    r"C:\Users\marqu\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)


def extrair_dados_json(dados_json):
    conteudo = dados_json.strip()
    match = re.search(r"(\{.*\})", conteudo, re.DOTALL)

    if match:
        conteudo = match.group(1)

    return json.loads(conteudo)


def salvar_no_csv(dados_dict):
    df = pd.DataFrame([dados_dict])

    modo = "a" if ARQUIVO_CSV.exists() else "w"
    header = not ARQUIVO_CSV.exists()

    df.to_csv(ARQUIVO_CSV, mode=modo, index=False, header=header, encoding="utf-8")
    print(f"OK Dados de '{dados_dict.get('empresa', 'Desconhecida')}' persistidos no CSV.")


def exportar_planilha():
    if not ARQUIVO_CSV.exists():
        print("Aviso: CSV base nao encontrado, exportacao da planilha ignorada.")
        return

    if not BUILDER_PLANILHA.exists():
        print("Aviso: script de exportacao da planilha nao encontrado.")
        return

    if not NODE_RUNTIME.exists():
        print("Aviso: runtime Node nao encontrado para gerar a planilha XLSX.")
        return

    try:
        subprocess.run(
            [str(NODE_RUNTIME), str(BUILDER_PLANILHA), str(ARQUIVO_CSV), str(ARQUIVO_PLANILHA)],
            cwd=BASE_DIR,
            check=True,
        )
        print(f"OK Planilha gerada em: {ARQUIVO_PLANILHA}")
    except subprocess.CalledProcessError as exc:
        print(f"Erro ao gerar planilha XLSX: {exc}")


def run():
    pasta_pdfs = "C:/Users/marqu/Desktop/ProjetoPessoais/teste_faturas"

    if not os.path.exists(pasta_pdfs):
        print(f"Erro: pasta nao encontrada: {pasta_pdfs}")
        return

    leitor = LeitorPDFTool()

    for arquivo in os.listdir(pasta_pdfs):
        if arquivo.endswith(".pdf"):
            print(f"Lendo arquivo: {arquivo}")
            caminho_full = os.path.join(pasta_pdfs, arquivo)

            conteudo = leitor._run(caminho_full)

            if not conteudo or len(conteudo.strip()) < 10:
                continue

            inputs = {
                "nome_arquivo": arquivo,
                "conteudo_pdf": conteudo,
            }

            resultado = FaturasPdfCrew().crew().kickoff(inputs=inputs)

            try:
                dados_dict = extrair_dados_json(resultado.raw)
                dados_dict["arquivo"] = arquivo
                salvar_no_csv(dados_dict)
            except Exception as exc:
                print(f"Erro ao processar resposta da crew para '{arquivo}': {exc}")
                print(f"DEBUG - Conteudo recebido: {resultado.raw}")

    exportar_planilha()


if __name__ == "__main__":
    run()
