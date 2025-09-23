// SPDX-License-Identifier: MIT

use core::integer::u256;
use starknet::{ContractAddress, get_caller_address};

// Interface definition
#[starknet::interface]
pub trait IKRC<CS> {
    // Custom KRC functions
    fn mint(ref self: CS, to: ContractAddress, amount: u256);
    fn burn(ref self: CS, amount: u256);
    fn pause(ref self: CS);
    fn unpause(ref self: CS);
}

// Contract implementation
#[starknet::contract]
pub mod KRC {
    use OwnableComponent::InternalTrait;
    use core::integer::u256;
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_token::erc20::ERC20Component;
    use openzeppelin_token::erc20::ERC20Component::{
        ERC20HooksTrait, InternalTrait as ERC20InternalTrait,
    };
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use super::{ContractAddress, get_caller_address};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableTwoStepImpl = OwnableComponent::OwnableTwoStepImpl<ContractState>;
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;

    // Events
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    // Storage
    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        paused: bool,
        // Constants
        max_supply: u256,
        initial_supply: u256,
    }

    // Constructor
    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        // Initialize Ownable
        self.ownable.initializer(owner);

        // Initialize ERC20
        let name = "KRC";
        let symbol = "KRC";
        self.erc20.initializer(name, symbol);

        // Set constants
        let max_supply_val = 100000000000000000000000000; // 100M KRC
        let initial_supply_val = 10000000000000000000000000; // 10M KRC

        self.max_supply.write(max_supply_val);
        self.initial_supply.write(initial_supply_val);

        // Mint initial supply to owner
        self.erc20.mint(owner, initial_supply_val);
    }

    // Modifiers
    fn only_owner(self: @ContractState) {
        self.ownable.assert_only_owner();
    }

    fn when_not_paused(self: @ContractState) {
        let is_paused = self.paused.read();
        assert(!is_paused, 'Paused');
    }

    fn valid_amount(amount: u256) {
        assert(amount > 0, 'Amount > 0');
    }


    fn zero_address() -> ContractAddress {
        let zero: felt252 = 0;
        zero.try_into().unwrap()
    }

    // Implementation
    #[abi(embed_v0)]
    impl IKRCImpl of super::IKRC<ContractState> {
        // Custom KRC functions
        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            only_owner(@self);
            valid_amount(amount);

            let current_supply = self.erc20.total_supply();
            let max_supply_val = self.max_supply.read();
            let new_supply = current_supply + amount;
            assert(new_supply <= max_supply_val, 'Exceeds max supply');

            self.erc20.mint(to, amount);
        }

        fn burn(ref self: ContractState, amount: u256) {
            valid_amount(amount);

            let caller = get_caller_address();
            let current_balance = self.erc20.balance_of(caller);
            assert(current_balance >= amount, 'Insufficient');

            self.erc20.burn(caller, amount);
        }

        fn pause(ref self: ContractState) {
            only_owner(@self);
            self.paused.write(true);
        }

        fn unpause(ref self: ContractState) {
            only_owner(@self);
            self.paused.write(false);
        }
    }

    // ERC20 Hooks implementation
    impl ERC20HooksImpl of ERC20HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) { // No additional logic needed before update
        }

        fn after_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) { // No additional logic needed after update
        }
    }
}
