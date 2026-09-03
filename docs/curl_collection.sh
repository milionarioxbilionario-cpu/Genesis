#!/bin/bash
# Simple curl script demonstrating the critical flows for Genesis API
# Usage: edit API_BASE and run: bash curl_collection.sh

API_BASE=${API_BASE:-http://localhost:4000}

# 1) Login (replace with owner credentials created in DB or by admin flow)
# curl -X POST "$API_BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"owner@example.test","password":"<password-demo-removida-do-historico>"}'

# Example sequence (assumes JWT token is available in TOKEN variable)
# TOKEN="<paste token here>"

# 2) Configure cancel PIN (owner only)
# curl -X POST "$API_BASE/api/sales/cancel-pin" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"pin":"1234"}'

# 3) Create product (owner)
# curl -X POST "$API_BASE/api/products" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Curl Test Product","sell_price":500,"cost_price":300,"stock_qty":10}'

# 4) Create a sale (cashier or owner)
# curl -X POST "$API_BASE/api/sales" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"items":[{"product_id":"<product_id>","product_name":"Curl Test Product","quantity":2,"unit_sell_price":500,"unit_cost_price":300}],"total_amount":1000,"total_cost":600,"payment_method":"cash","amount_received":1000}'

# 5) Cancel sale (owner PIN required)
# curl -X POST "$API_BASE/api/sales/<sale_id>/cancel" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"pin":"1234"}'

# 6) Check audit log (super_admin or via SQL Editor in Supabase)
# curl -X GET "$API_BASE/api/admin/tenants" -H "Authorization: Bearer $TOKEN"

echo "Script created. Edit API_BASE/TOKEN/product_id/sale_id as needed and uncomment commands to run."