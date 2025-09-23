use starknet::ContractAddress;
use starknet_testing::{cheat_caller_address, set_caller_address};
use snforge_std::{declare, ContractClassTrait, start_cheat_caller_address, stop_cheat_caller_address};

use kidsviewer::KRCPrivilegeManager::{
    IKRCPrivilegeManagerDispatcher, IKRCPrivilegeManagerDispatcherTrait,
};
use kidsviewer::KRC::{IKRCDispatcher, IKRCDispatcherTrait};
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

#[test]
fn test_privilege_access_grant() {
    let owner = starknet::contract_address_const::<0x123>();
    let user = starknet::contract_address_const::<0x456>();
    let feature = 'test_feature';

    // Deploy KRC contract
    let krc_contract = declare("KRC").unwrap().contract_class();
    let krc_contract_address = krc_contract.deploy(@array![owner.into()]).unwrap();
    let krc_dispatcher = IKRCDispatcher { contract_address: krc_contract_address };

    // Deploy Privilege Manager contract
    let privilege_contract = declare("KRCPrivilegeManager").unwrap().contract_class();
    let privilege_contract_address = privilege_contract.deploy(@array![owner.into()]).unwrap();
    let privilege_dispatcher = IKRCPrivilegeManagerDispatcher { contract_address: privilege_contract_address };

    // Set KRC contract in privilege manager
    set_caller_address(privilege_contract_address, owner);
    privilege_dispatcher.set_krc_contract(krc_contract_address);

    // Grant privilege access
    set_caller_address(privilege_contract_address, owner);
    privilege_dispatcher.grant_privilege_access(user, feature);

    // Check if user has privilege access
    let has_access = privilege_dispatcher.has_privilege_access(user, feature);
    assert(has_access, 'User should have privilege access');
}

#[test]
fn test_feature_proposal_creation() {
    let owner = starknet::contract_address_const::<0x123>();
    let proposer = starknet::contract_address_const::<0x456>();
    let title = 'Test Feature';
    let description = 'This is a test feature proposal';
    let feature = 'new_feature';
    let duration = 86400; // 1 day

    // Deploy KRC contract
    let krc_contract = declare("KRC").unwrap().contract_class();
    let krc_contract_address = krc_contract.deploy(@array![owner.into()]).unwrap();
    let krc_dispatcher = IKRCDispatcher { contract_address: krc_contract_address };

    // Mint some KRC to proposer
    set_caller_address(krc_contract_address, owner);
    krc_dispatcher.mint(proposer, 2000000000000000000000); // 2000 KRC

    // Deploy Privilege Manager contract
    let privilege_contract = declare("KRCPrivilegeManager").unwrap().contract_class();
    let privilege_contract_address = privilege_contract.deploy(@array![owner.into()]).unwrap();
    let privilege_dispatcher = IKRCPrivilegeManagerDispatcher { contract_address: privilege_contract_address };

    // Set KRC contract in privilege manager
    set_caller_address(privilege_contract_address, owner);
    privilege_dispatcher.set_krc_contract(krc_contract_address);

    // Create feature proposal
    set_caller_address(privilege_contract_address, proposer);
    privilege_dispatcher.create_proposal(title, description, 'feature', duration);

    // Check if proposal was created
    let proposal = privilege_dispatcher.get_proposal(1);
    assert(proposal.title == title, 'Proposal title should match');
    assert(proposal.description == description, 'Proposal description should match');
    assert(proposal.proposal_type == 'feature', 'Proposal type should match');
    assert(proposal.proposer == proposer, 'Proposal proposer should match');
}

#[test]
fn test_feature_voting() {
    let owner = starknet::contract_address_const::<0x123>();
    let voter = starknet::contract_address_const::<0x456>();
    let title = 'Test Feature';
    let description = 'This is a test feature proposal';
    let feature = 'new_feature';
    let duration = 86400; // 1 day

    // Deploy KRC contract
    let krc_contract = declare("KRC").unwrap().contract_class();
    let krc_contract_address = krc_contract.deploy(@array![owner.into()]).unwrap();
    let krc_dispatcher = IKRCDispatcher { contract_address: krc_contract_address };

    // Mint some KRC to voter
    set_caller_address(krc_contract_address, owner);
    krc_dispatcher.mint(voter, 2000000000000000000000); // 2000 KRC

    // Deploy Privilege Manager contract
    let privilege_contract = declare("KRCPrivilegeManager").unwrap().contract_class();
    let privilege_contract_address = privilege_contract.deploy(@array![owner.into()]).unwrap();
    let privilege_dispatcher = IKRCPrivilegeManagerDispatcher { contract_address: privilege_contract_address };

    // Set KRC contract in privilege manager
    set_caller_address(privilege_contract_address, owner);
    privilege_dispatcher.set_krc_contract(krc_contract_address);

    // Create feature proposal
    set_caller_address(privilege_contract_address, voter);
    privilege_dispatcher.create_proposal(title, description, 'feature', duration);

    // Vote on the proposal
    privilege_dispatcher.vote_on_proposal(1, true);

    // Check if user voted
    let has_voted = privilege_dispatcher.get_user_votes(voter, 1);
    assert(has_voted, 'User should have voted');
}

#[test]
fn test_governance_proposal_creation() {
    let owner = starknet::contract_address_const::<0x123>();
    let proposer = starknet::contract_address_const::<0x456>();
    let title = 'Governance Proposal';
    let description = 'This is a governance proposal';
    let duration = 86400; // 1 day

    // Deploy KRC contract
    let krc_contract = declare("KRC").unwrap().contract_class();
    let krc_contract_address = krc_contract.deploy(@array![owner.into()]).unwrap();
    let krc_dispatcher = IKRCDispatcher { contract_address: krc_contract_address };

    // Mint some KRC to proposer
    set_caller_address(krc_contract_address, owner);
    krc_dispatcher.mint(proposer, 2000000000000000000000); // 2000 KRC

    // Deploy Privilege Manager contract
    let privilege_contract = declare("KRCPrivilegeManager").unwrap().contract_class();
    let privilege_contract_address = privilege_contract.deploy(@array![owner.into()]).unwrap();
    let privilege_dispatcher = IKRCPrivilegeManagerDispatcher { contract_address: privilege_contract_address };

    // Set KRC contract in privilege manager
    set_caller_address(privilege_contract_address, owner);
    privilege_dispatcher.set_krc_contract(krc_contract_address);

    // Create governance proposal
    set_caller_address(privilege_contract_address, proposer);
    privilege_dispatcher.create_proposal(title, description, 'governance', duration);

    // Check if proposal was created
    let proposal = privilege_dispatcher.get_proposal(1);
    assert(proposal.title == title, 'Proposal title should match');
    assert(proposal.description == description, 'Proposal description should match');
    assert(proposal.proposal_type == 'governance', 'Proposal type should match');
    assert(proposal.proposer == proposer, 'Proposal proposer should match');
}

#[test]
fn test_governance_voting() {
    let owner = starknet::contract_address_const::<0x123>();
    let voter = starknet::contract_address_const::<0x456>();
    let title = 'Governance Proposal';
    let description = 'This is a governance proposal';
    let duration = 86400; // 1 day

    // Deploy KRC contract
    let krc_contract = declare("KRC").unwrap().contract_class();
    let krc_contract_address = krc_contract.deploy(@array![owner.into()]).unwrap();
    let krc_dispatcher = IKRCDispatcher { contract_address: krc_contract_address };

    // Mint some KRC to voter
    set_caller_address(krc_contract_address, owner);
    krc_dispatcher.mint(voter, 2000000000000000000000); // 2000 KRC

    // Deploy Privilege Manager contract
    let privilege_contract = declare("KRCPrivilegeManager").unwrap().contract_class();
    let privilege_contract_address = privilege_contract.deploy(@array![owner.into()]).unwrap();
    let privilege_dispatcher = IKRCPrivilegeManagerDispatcher { contract_address: privilege_contract_address };

    // Set KRC contract in privilege manager
    set_caller_address(privilege_contract_address, owner);
    privilege_dispatcher.set_krc_contract(krc_contract_address);

    // Create governance proposal
    set_caller_address(privilege_contract_address, voter);
    privilege_dispatcher.create_proposal(title, description, 'governance', duration);

    // Vote on the governance proposal
    privilege_dispatcher.vote_on_proposal(1, true);

    // Check if proposal was created and voted on
    let proposal = privilege_dispatcher.get_proposal(1);
    assert(proposal.title == title, 'Proposal title should match');
    assert(proposal.proposal_type == 'governance', 'Proposal type should match');
    assert(proposal.for_votes > 0, 'Proposal should have votes');
}
