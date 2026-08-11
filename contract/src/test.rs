#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String,
};

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (TokenClient<'a>, StellarAssetClient<'a>, Address) {
    let token_address = env.register_stellar_asset_contract_v2(admin.clone()).address();
    let token = TokenClient::new(env, &token_address);
    let token_admin = StellarAssetClient::new(env, &token_address);
    (token, token_admin, token_address)
}

#[test]
fn test_create_submit_and_release_payment_success() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Khởi tạo Smart Contract StellarPact
    let contract_id = env.register(StellarPactContract, ());
    let client = StellarPactContractClient::new(&env, &contract_id);

    // 2. Tạo các tài khoản kiểm thử & Token giả định (Mock SAC Token)
    let client_user = Address::generate(&env);
    let freelancer_user = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_client, token_admin_client, token_id) = create_token_contract(&env, &token_admin);

    // Mint 1000 token cho client_user
    let initial_balance: i128 = 1000;
    let escrow_amount: i128 = 400;
    token_admin_client.mint(&client_user, &initial_balance);

    assert_eq!(token_client.balance(&client_user), 1000);
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&freelancer_user), 0);

    // 3. Test Hàm 1: Client tạo Deal thành công
    let deal_id = client.create_deal(
        &client_user,
        &freelancer_user,
        &token_id,
        &escrow_amount,
    );

    assert_eq!(deal_id, 1);
    assert_eq!(client.get_count(), 1);

    // Kiểm tra số dư token đã được chuyển vào hợp đồng
    assert_eq!(token_client.balance(&client_user), 600);
    assert_eq!(token_client.balance(&contract_id), 400);

    // Kiểm tra struct Deal đã được tạo đúng thông tin trong Storage
    let deal = client.get_deal(&deal_id).expect("Deal phai ton tai");
    assert_eq!(deal.client, client_user);
    assert_eq!(deal.freelancer, freelancer_user);
    assert_eq!(deal.token, token_id);
    assert_eq!(deal.amount, escrow_amount);
    assert_eq!(deal.is_submitted, false);

    // 4. Test Hàm 2: Freelancer nộp bài (Submit Work)
    let proof_url = String::from_str(&env, "https://github.com/stellar/stellar-pact/proof/1");
    client.submit_work(&freelancer_user, &deal_id, &proof_url);

    // Kiểm tra trạng thái nộp bài được chuyển thành true
    let deal_after_submit = client.get_deal(&deal_id).unwrap();
    assert_eq!(deal_after_submit.is_submitted, true);

    // 5. Test Hàm 3: Client duyệt và giải ngân (Release Payment)
    client.release_payment(&client_user, &deal_id);

    // Kiểm tra số dư token sau khi giải ngân
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&freelancer_user), 400);

    // XÁC NHẬN CỰC KỲ QUAN TRỌNG: Deal data đã được xóa khỏi ledger (Rent Refund)
    let deal_after_release = client.get_deal(&deal_id);
    assert_eq!(deal_after_release, None);
}

#[test]
fn test_unauthorized_submit_work() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellarPactContract, ());
    let client = StellarPactContractClient::new(&env, &contract_id);

    let client_user = Address::generate(&env);
    let freelancer_user = Address::generate(&env);
    let wrong_user = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (_, token_admin_client, token_id) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&client_user, &500);

    let deal_id = client.create_deal(&client_user, &freelancer_user, &token_id, &200);

    let proof_url = String::from_str(&env, "https://proof.com");

    // Thử dùng ví sai (`wrong_user`) để submit bài -> Trả về lỗi Unauthorized
    let res = client.try_submit_work(&wrong_user, &deal_id, &proof_url);
    assert_eq!(res, Err(Ok(Error::Unauthorized)));
}

#[test]
fn test_unauthorized_release_payment() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellarPactContract, ());
    let client = StellarPactContractClient::new(&env, &contract_id);

    let client_user = Address::generate(&env);
    let freelancer_user = Address::generate(&env);
    let wrong_user = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (_, token_admin_client, token_id) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&client_user, &500);

    let deal_id = client.create_deal(&client_user, &freelancer_user, &token_id, &200);

    // Thử dùng ví sai (`wrong_user`) để release payment -> Trả về lỗi Unauthorized
    let res = client.try_release_payment(&wrong_user, &deal_id);
    assert_eq!(res, Err(Ok(Error::Unauthorized)));
}

#[test]
fn test_invalid_amount_creation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StellarPactContract, ());
    let client = StellarPactContractClient::new(&env, &contract_id);

    let client_user = Address::generate(&env);
    let freelancer_user = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (_, token_admin_client, token_id) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&client_user, &500);

    // Thử tạo deal với amount = 0 -> Thất bại
    let res_zero = client.try_create_deal(&client_user, &freelancer_user, &token_id, &0);
    assert_eq!(res_zero, Err(Ok(Error::InvalidAmount)));

    // Thử tạo deal với amount < 0 -> Thất bại
    let res_neg = client.try_create_deal(&client_user, &freelancer_user, &token_id, &-100);
    assert_eq!(res_neg, Err(Ok(Error::InvalidAmount)));
}
