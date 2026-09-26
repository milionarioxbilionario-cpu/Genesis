@echo off
cd /d c:\Users\CMM\Desktop\Genesis\backend
set API_BASE=http://localhost:4020
set FORCE_DB=sqlite
set DB_ALLOW_SQLITE_FALLBACK=true
set NODE_ENV=development
node scripts\shift_closing_e2e.js > _test_out.txt 2>&1
