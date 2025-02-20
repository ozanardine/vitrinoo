@echo off
setlocal enabledelayedexpansion

:: Defina a pasta do projeto (pode ser alterada conforme necessário)
set "PROJECT_PATH=%CD%"

:: Defina o nome do arquivo de saída
set "OUTPUT_FILE=%PROJECT_PATH%\folder_structure.txt"

:: Defina as pastas a serem excluídas (separe com espaços)
set "EXCLUDE_DIRS=.git node_modules dist build .vscode .vite .tmp.drivedownload .tmp.driveupload"

:: Apagar arquivo de saída se já existir
if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"

:: Criar lista de exclusão
(for %%D in (%EXCLUDE_DIRS%) do echo %%D) > exclude_list.txt

:: Gerar estrutura de diretórios e arquivos excluindo pastas especificadas
tree "%PROJECT_PATH%" /A /F | findstr /V /G:exclude_list.txt > "%OUTPUT_FILE%"

:: Remover lista de exclusão
del exclude_list.txt

:: Exibir mensagem de conclusão
echo Estrutura da pasta gerada em "%OUTPUT_FILE%"
pause
