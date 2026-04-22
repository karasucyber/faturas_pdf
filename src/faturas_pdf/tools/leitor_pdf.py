from crewai.tools import BaseTool
import pdfplumber

class LeitorPDFTool(BaseTool):
    name: str = "Leitor de PDF"
    description: str = "Extrai todo o texto de um arquivo PDF para processamento de dados."

    def _run(self, caminho_arquivo: str) -> str:
        texto_completo = ""
        try:
            with pdfplumber.open(caminho_arquivo) as pdf:
                for pagina in pdf.pages:
                    extraido = pagina.extract_text()
                    if extraido:
                        texto_completo += extraido + "\n"
            return texto_completo
        except Exception as e:
            return f"Erro ao ler PDF: {str(e)}"