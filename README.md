# StellarPact 

**Ứng dụng Escrow tự động hóa thông qua Hợp đồng thông minh trên Mạng Stellar**

**StellarPact** là một nền tảng escrow phi tập trung được xây dựng trên hệ sinh thái Stellar, cho phép người dùng khóa tài sản (XLM) vào một thỏa thuận an toàn và tự động giải phóng chúng dựa trên các điều kiện được xác định trước. Hệ thống loại bỏ nhu cầu về bên trung gian thứ ba bằng cách sử dụng sức mạnh của hợp đồng thông minh ( Soroban) và tuân thủ các tiêu chuẩn bảo mật tiên tiến của Stellar.

## 🚀 Đặc điểm nổi bật

### 🔹 **Hợp đồng thông minh tự động hóa**
- Sử dụngSoroban để tự động hóa việc xử lý escrow mà không cần can thiệp của con người
- Thời gian khóa và tiêu chí giải phóng được lập trình trước, đảm bảo tính minh bạch và công bằng

### 🔹 **Quản lý toàn diện**
- Quản lý thỏa thuận escrow từ tạo đến đóng thông qua giao diện người dùng thân thiện
- Theo dõi trạng thái thời gian thực và lịch sử giao dịch

### 🔹 **Bảo mật Stellar**
- Tận dụng bảo mật mạnh mẽ và phân quyền của mạng Stellar
- Tích hợp dễ dàng với các ví Stellar hiện có

### 🔹 **Đáng tin cậy**
- Các hợp đồng thông minh được kiểm toán và tuân thủ các tiêu chuẩn mới nhất
- Các giao dịch minh bạch trên sổ cái công khai của Stellar

## 🏗️ Kiến trúc hệ thống

```
┌───────────────────────────────────────────────────────────┐
│                    StellarPact Frontend                 │
│               React + TypeScript + Tailwind CSS          │
│  React Hooks: useStellar, useWallet, useContract        │
│  Contract SDK: Stellar Soroban SDK                      │
└───────────────────────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│                 StellarPact Backend                     │
│           Node.js + Express + TypeScript                │
│  Soroban Event Poller, Smart Contract Interaction       │
└───────────────────────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│                 Stellar Network                         │
│               Public Ledger + Smart Contracts             │
└───────────────────────────────────────────────────────────┘
```

## 📋 Yêu cầu hệ thống

- **Node.js** 20.x hoặc cao hơn
- **npm** 10.x hoặc cao hơn
- **Git** 2.x hoặc cao hơn
- Truy cập mạng **Stellar Testnet**

## 📦 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd Micro_Escrow
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

### 3. Cấu hình môi trường Backend

 Tạo tệp `.env` trong thư mục `backend/`:

```dotenv
PORT=4000
STELLAR_NETWORK=TESTNET
HORIZON_URL=https://horizon-testnet.stellar.org
RPC_URL=https://soroban-testnet.stellar.org
CONTRACT_ID=CDRYXQUA545AOY4CSA4MGRLJ32F5M5H4BMYGVSWYPF6HCUK7Y2QD6OPA
```

### 4. Khởi chạy Backend

```bash
npm run start
```

 Backend sẽ chạy trên cổng `4000` và bắt đầu lắng nghe các sự kiện của Soroban.

### 5. Cài đặt Frontend

```bash
cd frontend
npm install
```

### 6. Cấu hình môi trường Frontend

 Tạo tệp `.env.local` trong thư mục `frontend/`:

```dotenv
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_STELLAR_NETWORK="TESTNET"
NEXT_PUBLIC_HORIZON_URL="https://horizon-testnet.stellar.org"
NEXT_PUBLIC_SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_STELLAR_PACT_CONTRACT_ID="CDRYXQUA545AOY4CSA4MGRLJ32F5M5H4BMYGVSWYPF6HCUK7Y2QD6OPA"
```

### 7. Khởi chạy Frontend

```bash
npm run dev
```

 Frontend sẽ chạy trên cổng `3000` và có thể truy cập tại `http://localhost:3000`.

## 🛠️ Cách sử dụng

### 1. Kết nối ví Stellar

- Click nút **"Kết nối ví"** trên trang chủ
- Chọn ví Stellar của bạn (FriendBot hỗ trợ cho testnet)
- Xác nhận kết nối trong giao diện ví của bạn

### 2. Tạo escrow mới

- Nhập **số lượng XLM** muốn ký quỹ
- Thiết lập **thời gian khóa** tính bằng giây
- Cấu hình các điều kiện giải phóng (nếu có)
- Xác nhận tạo escrow trong ví của bạn

### 3. Theo dõi escrow

- Xem danh sách các escrow hiện tại của bạn
- Kiểm tra trạng thái thời gian thực của escrow
- Xem chi tiết giao dịch trên Stellar Explorer

### 4. Giải phóng hoặc khiếu nại escrow

- Khi đến hạn, escrow sẽ được tự động giải phóng
- Các bên có thể đồng ý kết thúc escrow trước thời hạn
- Hệ thống hỗ trợ cơ chế giải quyết tranh chấp trong trường hợp cần thiết

## 🔄 Kịch bản sử dụng

### Scenario 1: Mua bán hàng trực tuyến

1. Người mua tạo escrow với số lượng XLM theo thỏa thuận
2. Người bán xác nhận nhậnXLMARR
3. Sau khi nhận hàng, người mua giải phóng escrow
4. Tài sản tự động chuyển sang người bán

### Scenario 2: Thanh toán dựa trên milestone

1. Người thuê nhà tạo escrow hàng tháng
2. Chủ nhà xác nhận việc bàn giao công việc (sửa chữa, nâng cấp)
3. Escrow được giải phóng sau khi xác nhận hoàn thành

### Scenario 3: Tài trợ dự án

1. Nhà đầu tư ký quỹ vào escrow cho dự án
2. Các khoản giải ngân tự động dựa trên tiến độ hoàn thành
3. Phần còn lại của escrow sẽ được trả lại sau khi dự án hoàn thành

## 📝 Hợp đồng thông minh

Thực thể escrow được triển khai thông qua hợp đồng thông minh Stellar Soroban với các chức năng sau:

### 🔹 `create_escrow(party_a, party_b, amount, release_timestamp, conditions)`

Tạo một escrow mới với các tham số:

- `party_a`: Tài khoản khởi tạo escrow (người mua/bên trả tiền)
- `party_b`: Tài khoản nhận tiền (người bán/bên nhận dịch vụ)
- `amount`: Số lượng XLM sẽ ký quỹ
- `release_timestamp`: Thời gian dự kiến giải phóng ( Unix timestamp)
- `conditions`: Điều kiện giải phóng bổ sung (nếu có)

### 🔹 `release_escrow(escrow_id, releaser)`

Giải phóng escrow sau khi thời gian khóa kết thúc:

- Chỉ có thể gọi bởi `party_a` hoặc `party_b`
- Yêu cầu escrow đã đến hạn
- Tự động chuyển tiền XLM sang tài khoản nhận

### 🔹 `dispute_escrow(escrow_id, disputer)`

Khởi tạo quy trình giải quyết tranh chấp:

- Có thể gọi bởi bất kỳ bên nào trước thời hạn giải phóng
- Yêu cầu các bên cung cấp bằng chứng
- Kích hoạt cơ chế giải quyết tranh chấp bên ngoài

## 🔐 Bảo mật

- Tất cả tài sản được lưu trữ an toàn trong escrow smart contract
- Không có dữ liệu nhạy cảm nào được lưu trữ cục bộ - tất cả đều trên sổ cái công khai của Stellar
- Truy cập được xác thực thông qua chữ ký số của ví Stellar
- Tích hợp với Stellar Gateways để xác thực danh tính (tùy chọn)

## 🛠️ Công nghệ được sử dụng

### Frontend:

-