# Script deploy Smart Contract StellarPact lên Stellar Soroban Testnet
Param (
    [string]$SecretKey = ""
)

Write-Host "🚀 Bắt đầu quá trình Build & Deploy Soroban Smart Contract lên Stellar Testnet..." -ForegroundColor Cyan

# 1. Biên dịch file .wasm tối ưu
Write-Host "📦 1. Biên dịch mã nguồn Rust sang WASM..." -ForegroundColor Yellow
cargo build --target wasm32-unknown-unknown --release

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi biên dịch Cargo. Vui lòng kiểm tra mã nguồn Rust!" -ForegroundColor Red
    exit 1
}

$WasmPath = "target/wasm32-unknown-unknown/release/stellar_pact.wasm"
Write-Host "✅ Đã tạo thành công file WASM tại: $WasmPath" -ForegroundColor Green

# 2. Hướng dẫn deploy với Stellar CLI
Write-Host "`n🌐 2. Để Deploy file WASM này lên Stellar Testnet, hãy chạy lệnh sau:" -ForegroundColor Cyan
Write-Host "stellar contract deploy --wasm $WasmPath --source <YOUR_SECRET_KEY> --network testnet" -ForegroundColor White

Write-Host "`n💡 Sau khi deploy thành công, sao chép Contract ID (bắt đầu bằng 'C...') và dán vào:" -ForegroundColor Yellow
Write-Host "  - backend/.env -> STELLAR_PACT_CONTRACT_ID" -ForegroundColor Gray
Write-Host "  - frontend/.env.local -> NEXT_PUBLIC_STELLAR_PACT_CONTRACT_ID" -ForegroundColor Gray
