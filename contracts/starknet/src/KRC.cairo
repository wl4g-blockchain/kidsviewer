// SPDX-License-Identifier: MIT

use core::integer::u256;
use starknet::event::EventEmitter;
use starknet::{ContractAddress, get_block_timestamp, get_caller_address};

// Interface definition
#[starknet::interface]
pub trait IKRC<CS> {
    fn name(self: @CS) -> felt252;
    fn symbol(self: @CS) -> felt252;
    fn decimals(self: @CS) -> u8;
    fn total_supply(self: @CS) -> u256;
    fn balance_of(self: @CS, account: ContractAddress) -> u256;
    fn allowance(self: @CS, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: CS, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: CS, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(ref self: CS, spender: ContractAddress, amount: u256) -> bool;
    fn mint(ref self: CS, to: ContractAddress, amount: u256);
    fn burn(ref self: CS, amount: u256);
    fn update_fee_discount(ref self: CS, user: ContractAddress);
    fn update_yield_boost(ref self: CS, user: ContractAddress);
    fn update_governance_power(ref self: CS, user: ContractAddress);
    fn grant_privilege_access(ref self: CS, user: ContractAddress, feature: felt252);
    fn start_staking(ref self: CS, amount: u256, duration: u64);
    fn end_staking(ref self: CS);
    fn create_proposal(ref self: CS, title: felt252, description: felt252, duration: u64);
    fn vote(ref self: CS, proposal_id: u64, support: bool);
    fn execute_proposal(ref self: CS, proposal_id: u64);
    fn pause(ref self: CS);
    fn unpause(ref self: CS);
    fn emergency_withdraw(ref self: CS);
}

// Contract implementation
#[starknet::contract]
pub mod KRC {
    use core::integer::u256;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use super::{ContractAddress, EventEmitter, get_block_timestamp, get_caller_address};

    // Events
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        FeeDiscountUpdated: FeeDiscountUpdated,
        YieldBoostUpdated: YieldBoostUpdated,
        GovernanceVoteCast: GovernanceVoteCast,
        PrivilegeAccessGranted: PrivilegeAccessGranted,
        StakingStarted: StakingStarted,
        StakingEnded: StakingEnded,
        ProposalCreated: ProposalCreated,
        ProposalExecuted: ProposalExecuted,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FeeDiscountUpdated {
        pub user: ContractAddress,
        pub discount_rate: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct YieldBoostUpdated {
        pub user: ContractAddress,
        pub boost_rate: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GovernanceVoteCast {
        pub user: ContractAddress,
        pub proposal_id: u64,
        pub support: bool,
        pub votes: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PrivilegeAccessGranted {
        pub user: ContractAddress,
        pub feature: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StakingStarted {
        pub user: ContractAddress,
        pub amount: u256,
        pub duration: u64,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StakingEnded {
        pub user: ContractAddress,
        pub amount: u256,
        pub rewards: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ProposalCreated {
        pub proposal_id: u64,
        pub proposer: ContractAddress,
        pub title: felt252,
        pub description: felt252,
        pub start_time: u64,
        pub end_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ProposalExecuted {
        pub proposal_id: u64,
        pub timestamp: u64,
    }

    // Storage
    #[storage]
    struct Storage {
        // ERC20 state
        name: felt252,
        symbol: felt252,
        decimals: u8,
        total_supply: u256,
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
        // Pausable state
        paused: bool,
        // User benefits
        user_fee_discount: Map<ContractAddress, u256>,
        user_yield_boost: Map<ContractAddress, u256>,
        user_governance_power: Map<ContractAddress, u256>,
        user_privilege_access: Map<ContractAddress, bool>,
        // Staking state
        user_staking_amount: Map<ContractAddress, u256>,
        user_staking_start: Map<ContractAddress, u64>,
        user_staking_duration: Map<ContractAddress, u64>,
        user_total_staking_rewards: Map<ContractAddress, u256>,
        total_staked: u256,
        total_staking_rewards: u256,
        // Governance state
        proposals: Map<u64, bool>,
        proposal_titles: Map<u64, felt252>,
        proposal_descriptions: Map<u64, felt252>,
        proposal_start_times: Map<u64, u64>,
        proposal_end_times: Map<u64, u64>,
        proposal_for_votes: Map<u64, u256>,
        proposal_against_votes: Map<u64, u256>,
        proposal_executed: Map<u64, bool>,
        proposal_proposers: Map<u64, ContractAddress>,
        has_voted: Map<(ContractAddress, u64), bool>,
        next_proposal_id: u64,
        // Owner
        owner: ContractAddress,
        // Constants
        max_supply: u256,
        initial_supply: u256,
        staking_reward_rate: u256,
        min_staking_amount: u256,
        max_staking_duration: u64,
    }

    // Constructor
    #[constructor]
    fn constructor(ref self: ContractState) {
        let caller = get_caller_address();
        self.owner.write(caller);

        // Set token info
        self.name.write('KRC');
        self.symbol.write('KRC');
        self.decimals.write(18);

        // Set constants
        let max_supply_val = 100000000000000000000000000; // 100M KRC
        let initial_supply_val = 10000000000000000000000000; // 10M KRC
        let staking_reward_rate_val = 1000; // 10% APY in basis points
        let min_staking_amount_val = 1000000000000000000000; // 1000 KRC

        self.max_supply.write(max_supply_val);
        self.initial_supply.write(initial_supply_val);
        self.staking_reward_rate.write(staking_reward_rate_val);
        self.min_staking_amount.write(min_staking_amount_val);
        self.max_staking_duration.write(31536000); // 365 days in seconds

        // Mint initial supply to deployer
        self.total_supply.write(initial_supply_val);
        self.balances.write(caller, initial_supply_val);

        // Initialize proposal counter
        self.next_proposal_id.write(1);
    }

    // Modifiers
    fn only_owner(self: @ContractState) {
        let caller = get_caller_address();
        let owner = self.owner.read();
        assert(caller == owner, 'Only owner');
    }

    fn when_not_paused(self: @ContractState) {
        let is_paused = self.paused.read();
        assert(!is_paused, 'Contract is paused');
    }

    fn valid_amount(amount: u256) {
        assert(amount > 0, 'Amount must be > 0');
    }

    fn valid_duration(self: @ContractState, duration: u64) {
        assert(duration >= 2592000, 'Duration too short'); // 30 days
        let max_duration = self.max_staking_duration.read();
        assert(duration <= max_duration, 'Duration too long');
    }

    fn only_staker(self: @ContractState) {
        let caller = get_caller_address();
        let staking_amount = self.user_staking_amount.read(caller);
        assert(staking_amount > 0, 'No active staking');
    }

    // Implementation
    #[abi(embed_v0)]
    impl IKRCImpl of super::IKRC<ContractState> {
        fn name(self: @ContractState) -> felt252 {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> felt252 {
            self.symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.decimals.read()
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn allowance(
            self: @ContractState, owner: ContractAddress, spender: ContractAddress,
        ) -> u256 {
            self.allowances.read((owner, spender))
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            when_not_paused(@self);
            valid_amount(amount);

            let caller = get_caller_address();
            let sender_balance = self.balances.read(caller);
            assert(sender_balance >= amount, 'Insufficient balance');

            let new_sender_balance = sender_balance - amount;
            let recipient_balance = self.balances.read(recipient);
            let new_recipient_balance = recipient_balance + amount;

            self.balances.write(caller, new_sender_balance);
            self.balances.write(recipient, new_recipient_balance);

            true
        }

        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            when_not_paused(@self);
            valid_amount(amount);

            let caller = get_caller_address();
            let current_allowance = self.allowances.read((sender, caller));
            assert(current_allowance >= amount, 'Insufficient allowance');

            let sender_balance = self.balances.read(sender);
            assert(sender_balance >= amount, 'Insufficient balance');

            let new_allowance = current_allowance - amount;
            let new_sender_balance = sender_balance - amount;
            let recipient_balance = self.balances.read(recipient);
            let new_recipient_balance = recipient_balance + amount;

            self.allowances.write((sender, caller), new_allowance);
            self.balances.write(sender, new_sender_balance);
            self.balances.write(recipient, new_recipient_balance);

            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            when_not_paused(@self);

            let caller = get_caller_address();
            self.allowances.write((caller, spender), amount);

            true
        }

        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            only_owner(@self);
            valid_amount(amount);

            let current_supply = self.total_supply.read();
            let max_supply_val = self.max_supply.read();
            let new_supply = current_supply + amount;
            assert(new_supply <= max_supply_val, 'Exceeds maximum supply');

            self.total_supply.write(new_supply);
            let current_balance = self.balances.read(to);
            let new_balance = current_balance + amount;
            self.balances.write(to, new_balance);
        }

        fn burn(ref self: ContractState, amount: u256) {
            when_not_paused(@self);
            valid_amount(amount);

            let caller = get_caller_address();
            let current_balance = self.balances.read(caller);
            assert(current_balance >= amount, 'Insufficient balance');

            let new_balance = current_balance - amount;
            let current_supply = self.total_supply.read();
            let new_supply = current_supply - amount;

            self.balances.write(caller, new_balance);
            self.total_supply.write(new_supply);
        }

        fn update_fee_discount(ref self: ContractState, user: ContractAddress) {
            only_owner(@self);

            let balance = self.balances.read(user);
            let min_balance = 10000000000000000000000; // 10K KRC
            let discount = if balance >= min_balance {
                500
            } else {
                0
            }; // 5% or 0%

            self.user_fee_discount.write(user, discount);

            let timestamp = get_block_timestamp();
            self.emit(FeeDiscountUpdated { user, discount_rate: discount, timestamp });
        }

        fn update_yield_boost(ref self: ContractState, user: ContractAddress) {
            only_owner(@self);

            let balance = self.balances.read(user);
            let min_balance = 5000000000000000000000; // 5K KRC
            let boost = if balance >= min_balance {
                1000
            } else {
                0
            }; // 10% or 0%

            self.user_yield_boost.write(user, boost);

            let timestamp = get_block_timestamp();
            self.emit(YieldBoostUpdated { user, boost_rate: boost, timestamp });
        }

        fn update_governance_power(ref self: ContractState, user: ContractAddress) {
            only_owner(@self);

            let balance = self.balances.read(user);
            let staking_amount = self.user_staking_amount.read(user);
            let total_power = balance + staking_amount;

            self.user_governance_power.write(user, total_power);
        }

        fn grant_privilege_access(
            ref self: ContractState, user: ContractAddress, feature: felt252,
        ) {
            only_owner(@self);

            self.user_privilege_access.write(user, true);

            let timestamp = get_block_timestamp();
            self.emit(PrivilegeAccessGranted { user, feature, timestamp });
        }

        fn start_staking(ref self: ContractState, amount: u256, duration: u64) {
            when_not_paused(@self);
            valid_amount(amount);
            valid_duration(@self, duration);

            let caller = get_caller_address();
            let balance = self.balances.read(caller);
            let current_staking = self.user_staking_amount.read(caller);
            assert(balance >= amount, 'Insufficient balance');
            assert(current_staking == 0, 'Already staking');

            let min_amount = self.min_staking_amount.read();
            assert(amount >= min_amount, 'Amount below minimum');

            let timestamp = get_block_timestamp();

            self.user_staking_amount.write(caller, amount);
            self.user_staking_start.write(caller, timestamp);
            self.user_staking_duration.write(caller, duration);

            let current_balance = self.balances.read(caller);
            let new_balance = current_balance - amount;
            self.balances.write(caller, new_balance);

            let current_total_staked = self.total_staked.read();
            let new_total_staked = current_total_staked + amount;
            self.total_staked.write(new_total_staked);

            self.emit(StakingStarted { user: caller, amount, duration, timestamp });
        }

        fn end_staking(ref self: ContractState) {
            when_not_paused(@self);
            only_staker(@self);

            let caller = get_caller_address();
            let staking_amount = self.user_staking_amount.read(caller);
            let staking_start = self.user_staking_start.read(caller);
            let staking_duration = self.user_staking_duration.read(caller);

            let timestamp = get_block_timestamp();
            assert(timestamp >= staking_start + staking_duration, 'Staking period not ended');

            let staking_reward_rate = self.staking_reward_rate.read();
            let time_staked = timestamp - staking_start;
            let time_staked_u256 = time_staked.into();
            let rewards = (staking_amount * staking_reward_rate * time_staked_u256)
                / (10000 * 365 * 24 * 3600);

            let current_balance = self.balances.read(caller);
            let new_balance = current_balance + staking_amount + rewards;
            self.balances.write(caller, new_balance);

            let current_total_rewards = self.user_total_staking_rewards.read(caller);
            let new_total_rewards = current_total_rewards + rewards;
            self.user_total_staking_rewards.write(caller, new_total_rewards);

            let current_total_staked = self.total_staked.read();
            let new_total_staked = current_total_staked - staking_amount;
            self.total_staked.write(new_total_staked);

            self.user_staking_amount.write(caller, 0);
            self.user_staking_start.write(caller, 0);
            self.user_staking_duration.write(caller, 0);

            self.emit(StakingEnded { user: caller, amount: staking_amount, rewards, timestamp });
        }

        fn create_proposal(
            ref self: ContractState, title: felt252, description: felt252, duration: u64,
        ) {
            when_not_paused(@self);

            let caller = get_caller_address();
            let balance = self.balances.read(caller);
            let min_balance = 1000000000000000000000; // 1K KRC
            assert(balance >= min_balance, 'Insufficient balance');
            assert(duration >= 86400, 'Duration too short'); // 1 day
            assert(duration <= 604800, 'Duration too long'); // 7 days

            let proposal_id = self.next_proposal_id.read();
            let timestamp = get_block_timestamp();
            let start_time = timestamp + 3600; // 1 hour delay
            let end_time = start_time + duration;

            self.proposals.write(proposal_id, true);
            self.proposal_titles.write(proposal_id, title);
            self.proposal_descriptions.write(proposal_id, description);
            self.proposal_start_times.write(proposal_id, start_time);
            self.proposal_end_times.write(proposal_id, end_time);
            self.proposal_for_votes.write(proposal_id, 0);
            self.proposal_against_votes.write(proposal_id, 0);
            self.proposal_executed.write(proposal_id, false);
            self.proposal_proposers.write(proposal_id, caller);

            self.next_proposal_id.write(proposal_id + 1);

            self
                .emit(
                    ProposalCreated {
                        proposal_id, proposer: caller, title, description, start_time, end_time,
                    },
                );
        }

        fn vote(ref self: ContractState, proposal_id: u64, support: bool) {
            when_not_paused(@self);

            let exists = self.proposals.read(proposal_id);
            assert(exists, 'Proposal not found');

            let caller = get_caller_address();
            let timestamp = get_block_timestamp();
            let start_time = self.proposal_start_times.read(proposal_id);
            let end_time = self.proposal_end_times.read(proposal_id);
            assert(timestamp >= start_time, 'Voting not started');
            assert(timestamp <= end_time, 'Voting period ended');

            let has_voted_before = self.has_voted.read((caller, proposal_id));
            assert(!has_voted_before, 'Already voted');

            let balance = self.balances.read(caller);
            assert(balance > 0, 'No voting power');

            self.has_voted.write((caller, proposal_id), true);

            if support {
                let current_for_votes = self.proposal_for_votes.read(proposal_id);
                let new_for_votes = current_for_votes + balance;
                self.proposal_for_votes.write(proposal_id, new_for_votes);
            } else {
                let current_against_votes = self.proposal_against_votes.read(proposal_id);
                let new_against_votes = current_against_votes + balance;
                self.proposal_against_votes.write(proposal_id, new_against_votes);
            }

            self
                .emit(
                    GovernanceVoteCast {
                        user: caller, proposal_id, support, votes: balance, timestamp,
                    },
                );
        }

        fn execute_proposal(ref self: ContractState, proposal_id: u64) {
            when_not_paused(@self);

            let exists = self.proposals.read(proposal_id);
            assert(exists, 'Proposal not found');

            let timestamp = get_block_timestamp();
            let end_time = self.proposal_end_times.read(proposal_id);
            assert(timestamp >= end_time, 'Voting period not ended');

            let executed = self.proposal_executed.read(proposal_id);
            assert(!executed, 'Proposal already executed');

            let for_votes = self.proposal_for_votes.read(proposal_id);
            let against_votes = self.proposal_against_votes.read(proposal_id);
            assert(for_votes >= against_votes, 'Proposal did not pass');

            self.proposal_executed.write(proposal_id, true);

            self.emit(ProposalExecuted { proposal_id, timestamp });
        }

        fn pause(ref self: ContractState) {
            only_owner(@self);
            self.paused.write(true);
        }

        fn unpause(ref self: ContractState) {
            only_owner(@self);
            self.paused.write(false);
        }

        fn emergency_withdraw(ref self: ContractState) {
            only_owner(@self);

            let caller = get_caller_address();
            let balance = self.balances.read(caller);
            let staking_amount = self.user_staking_amount.read(caller);

            if staking_amount > 0 {
                let new_balance = balance + staking_amount;
                self.balances.write(caller, new_balance);
                self.user_staking_amount.write(caller, 0);
                self.user_staking_start.write(caller, 0);
                self.user_staking_duration.write(caller, 0);
            }
        }
    }
}

