#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String,
};

/// -----------------------------------------------------------------------------
/// ENUM LỖI TÙY CHỈNH (CUSTOM ERRORS)
/// -----------------------------------------------------------------------------
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    DealNotFound = 1,
    Unauthorized = 2,
    InvalidAmount = 3,
    AlreadySubmitted = 4,
    NotSubmitted = 5,
}

/// -----------------------------------------------------------------------------
/// 1. CẤU TRÚC DỮ LIỆU (DATA STRUCTURES)
/// -----------------------------------------------------------------------------

/// Enum `DataKey` dùng để quản lý Key-Value trong Storage của Soroban.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum DataKey {
    /// Lưu thông tin hợp đồng Escrow theo ID: `Deal(u64)`
    Deal(u64),
    /// Biến đếm tự tăng cho ID của Deal: `Count`
    Count,
}

/// Struct `Deal` chứa thông tin chi tiết của từng thỏa thuận Escrow.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Deal {
    /// Người khóa tiền (Client/Tác giả dự án)
    pub client: Address,
    /// Người nhận tiền (Freelancer/Người thực hiện)
    pub freelancer: Address,
    /// Địa chỉ Stellar Asset Contract - SAC (ví dụ XLM, USDC, ...)
    pub token: Address,
    /// Số tiền được khóa trong Escrow
    pub amount: i128,
    /// Trạng thái nộp bài / bằng chứng hoàn thành công việc
    pub is_submitted: bool,
}

/// -----------------------------------------------------------------------------
/// 2. HÀM CỐT LÕI (CONTRACT IMPLEMENTATION)
/// -----------------------------------------------------------------------------
#[contract]
pub struct StellarPactContract;

#[contractimpl]
impl StellarPactContract {
    /// Tạo một hợp đồng Escrow mới (Micro-Escrow Deal).
    ///
    /// - `client`: Ví người nạp/khóa tiền (bắt buộc xác thực `require_auth()`).
    /// - `freelancer`: Ví người nhận thanh toán khi công việc hoàn thành.
    /// - `token`: Địa chỉ hợp đồng SAC (Stellar Asset Contract).
    /// - `amount`: Số tiền nạp vào hợp đồng (phải > 0).
    ///
    /// Trả về: `deal_id` (u64) duy nhất của hợp đồng vừa tạo.
    pub fn create_deal(
        env: Env,
        client: Address,
        freelancer: Address,
        token: Address,
        amount: i128,
    ) -> Result<u64, Error> {
        // 1. Yêu cầu xác thực chữ ký của Client
        client.require_auth();

        // Kiểm tra số tiền phải hợp lệ (> 0)
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // 2. Chuyển token từ ví Client vào hợp đồng Smart Contract này
        let token_client = soroban_sdk::token::Client::new(&env, &token);
        let contract_address = env.current_contract_address();
        token_client.transfer(&client, &contract_address, &amount);

        // 3. Tự tăng biến đếm Count để tạo `deal_id`
        let mut count: u64 = env.storage().persistent().get(&DataKey::Count).unwrap_or(0);
        count = count.checked_add(1).ok_or(Error::InvalidAmount)?;

        // Khởi tạo thông tin Deal
        let deal = Deal {
            client: client.clone(),
            freelancer: freelancer.clone(),
            token: token.clone(),
            amount,
            is_submitted: false,
        };

        // Lưu thông tin `Deal` và `Count` cập nhật vào `persistent` storage
        env.storage().persistent().set(&DataKey::Count, &count);
        env.storage().persistent().set(&DataKey::Deal(count), &deal);

        // Gia hạn TTL cho storage entry để tránh dữ liệu bị hết hạn trên Ledger
        env.storage().persistent().extend_ttl(&DataKey::Deal(count), 100_000, 200_000);

        Ok(count)
    }

    /// Freelancer nộp bằng chứng công việc (Submit Work).
    ///
    /// - `freelancer`: Ví của freelancer (bắt buộc xác thực `require_auth()`).
    /// - `deal_id`: ID của hợp đồng Escrow.
    /// - `proof_url`: Đường dẫn chứa bằng chứng (IPFS, GitHub, URL,...).
    pub fn submit_work(
        env: Env,
        freelancer: Address,
        deal_id: u64,
        proof_url: String,
    ) -> Result<(), Error> {
        // 1. Yêu cầu xác thực chữ ký của Freelancer
        freelancer.require_auth();

        // 2. Lấy Deal từ storage
        let mut deal: Deal = env
            .storage()
            .persistent()
            .get(&DataKey::Deal(deal_id))
            .ok_or(Error::DealNotFound)?;

        // Kiểm tra ví gọi hàm có khớp với ví Freelancer trong hợp đồng không
        if freelancer != deal.freelancer {
            return Err(Error::Unauthorized);
        }

        // Cập nhật trạng thái nộp bài
        deal.is_submitted = true;
        env.storage().persistent().set(&DataKey::Deal(deal_id), &deal);

        // 3. Phát sự kiện (Event) lên Ledger
        // Topic: ("submit", deal_id), Payload: proof_url
        env.events().publish((symbol_short!("submit"), deal_id), proof_url);

        Ok(())
    }

    /// Client phê duyệt và giải ngân tiền cho Freelancer (Release Payment).
    ///
    /// - `client`: Ví của client (bắt buộc xác thực `require_auth()`).
    /// - `deal_id`: ID của hợp đồng Escrow.
    pub fn release_payment(env: Env, client: Address, deal_id: u64) -> Result<(), Error> {
        // 1. Yêu cầu xác thực chữ ký của Client
        client.require_auth();

        // 2. Lấy Deal từ storage
        let deal: Deal = env
            .storage()
            .persistent()
            .get(&DataKey::Deal(deal_id))
            .ok_or(Error::DealNotFound)?;

        // Kiểm tra ví gọi hàm có khớp với ví Client trong hợp đồng không
        if client != deal.client {
            return Err(Error::Unauthorized);
        }

        // 3. Chuyển tiền từ contract sang ví Freelancer bằng soroban_sdk::token::Client
        let token_client = soroban_sdk::token::Client::new(&env, &deal.token);
        let contract_address = env.current_contract_address();
        token_client.transfer(&contract_address, &deal.freelancer, &deal.amount);

        // 4. CỰC KỲ QUAN TRỌNG: Xóa dữ liệu deal khỏi ledger để nhận lại Rent Refund
        env.storage().persistent().remove(&DataKey::Deal(deal_id));

        // 5. Phát sự kiện (Event) giải ngân lên Ledger
        // Topic: ("release", deal_id), Payload: amount
        env.events().publish((symbol_short!("release"), deal_id), deal.amount);

        Ok(())
    }

    /// Hàm hỗ trợ xem thông tin một Deal (Read-only query).
    pub fn get_deal(env: Env, deal_id: u64) -> Option<Deal> {
        env.storage().persistent().get(&DataKey::Deal(deal_id))
    }

    /// Hàm hỗ trợ lấy tổng số Deal đã tạo.
    pub fn get_count(env: Env) -> u64 {
        env.storage().persistent().get(&DataKey::Count).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
