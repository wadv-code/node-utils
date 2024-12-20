@echo off
set "file=./dist/index.mjs"
set "node_modules=./node_modules/.modules.yaml"
IF EXIST "%node_modules%" (
    IF EXIST "%file%" (
        pnpm cmd-replace
    ) ELSE (
        pnpm stub && pnpm cmd-replace
    )
) ELSE (
    pnpm install && pnpm stub && pnpm cmd-replace
)
pause
