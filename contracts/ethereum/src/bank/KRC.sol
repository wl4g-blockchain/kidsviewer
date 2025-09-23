// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

/**
 * @title KRC (Knowledge Reward Coin)
 * @dev Platform utility token for KidsViewer platform
 * @notice This token provides platform benefits like fee discounts, yield boosts, and governance rights
 */
contract KRC is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
  // Events
  event FeeDiscountUpdated(address indexed user, uint256 discountRate, uint256 timestamp);
  event YieldBoostUpdated(address indexed user, uint256 boostRate, uint256 timestamp);
  event GovernanceVoteCast(address indexed user, uint256 proposalId, bool support, uint256 votes, uint256 timestamp);
  event PrivilegeAccessGranted(address indexed user, string feature, uint256 timestamp);
  event StakingStarted(address indexed user, uint256 amount, uint256 duration, uint256 timestamp);
  event StakingEnded(address indexed user, uint256 amount, uint256 rewards, uint256 timestamp);

  // Structs
  struct UserBenefits {
    uint256 feeDiscountRate; // Fee discount rate in basis points (0-10000)
    uint256 yieldBoostRate; // Yield boost rate in basis points (0-5000)
    uint256 governancePower; // Governance voting power
    bool hasPrivilegeAccess; // Whether user has privilege access
    uint256 stakingAmount; // Amount currently staked
    uint256 stakingStartTime; // When staking started
    uint256 stakingDuration; // Staking duration in seconds
    uint256 totalStakingRewards; // Total rewards earned from staking
  }

  struct Proposal {
    uint256 id;
    string title;
    string description;
    uint256 startTime;
    uint256 endTime;
    uint256 forVotes;
    uint256 againstVotes;
    bool executed;
    address proposer;
  }

  // State variables
  mapping(address => UserBenefits) private userBenefits;
  mapping(uint256 => Proposal) private proposals;
  mapping(address => mapping(uint256 => bool)) private hasVoted; // user => proposalId => hasVoted
  mapping(address => uint256) private stakingRewards; // Pending staking rewards

  uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18; // 100 million KRC
  uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10 ** 18; // 10 million KRC initial
  uint256 public constant STAKING_REWARD_RATE = 1000; // 10% APY in basis points
  uint256 public constant MIN_STAKING_AMOUNT = 1000 * 10 ** 18; // Minimum 1000 KRC to stake
  uint256 public constant MAX_STAKING_DURATION = 365 days; // Maximum 1 year staking

  uint256 private nextProposalId = 1;
  uint256 public totalStaked;
  uint256 public totalStakingRewards;

  // Modifiers
  modifier validAmount(uint256 amount) {
    require(amount > 0, 'KRC: Amount must be greater than 0');
    _;
  }

  modifier validDuration(uint256 duration) {
    require(duration >= 30 days && duration <= MAX_STAKING_DURATION, 'KRC: Invalid staking duration');
    _;
  }

  modifier onlyStaker() {
    require(userBenefits[msg.sender].stakingAmount > 0, 'KRC: No active staking');
    _;
  }

  constructor() ERC20('Knowledge Reward Coin', 'KRC') Ownable(msg.sender) {
    _mint(msg.sender, INITIAL_SUPPLY);
  }

  /**
   * @dev Mint new tokens (only owner)
   * @param to Address to mint to
   * @param amount Amount to mint
   */
  function mint(address to, uint256 amount) external onlyOwner {
    require(totalSupply() + amount <= MAX_SUPPLY, 'KRC: Exceeds maximum supply');
    _mint(to, amount);
  }

  /**
   * @dev Set fee discount rate for user based on KRC holdings
   * @param user Address of the user
   */
  function updateFeeDiscount(address user) external {
    uint256 balance = balanceOf(user);
    uint256 discountRate = 0;

    // Calculate discount based on holdings
    if (balance >= 100_000 * 10 ** 18) {
      // 100k+ KRC
      discountRate = 5000; // 50% discount
    } else if (balance >= 50_000 * 10 ** 18) {
      // 50k+ KRC
      discountRate = 3000; // 30% discount
    } else if (balance >= 10_000 * 10 ** 18) {
      // 10k+ KRC
      discountRate = 1500; // 15% discount
    } else if (balance >= 1_000 * 10 ** 18) {
      // 1k+ KRC
      discountRate = 500; // 5% discount
    }

    userBenefits[user].feeDiscountRate = discountRate;
    emit FeeDiscountUpdated(user, discountRate, block.timestamp);
  }

  /**
   * @dev Set yield boost rate for user based on KRC holdings
   * @param user Address of the user
   */
  function updateYieldBoost(address user) external {
    uint256 balance = balanceOf(user);
    uint256 boostRate = 0;

    // Calculate boost based on holdings
    if (balance >= 100_000 * 10 ** 18) {
      // 100k+ KRC
      boostRate = 2000; // 20% boost
    } else if (balance >= 50_000 * 10 ** 18) {
      // 50k+ KRC
      boostRate = 1500; // 15% boost
    } else if (balance >= 10_000 * 10 ** 18) {
      // 10k+ KRC
      boostRate = 1000; // 10% boost
    } else if (balance >= 1_000 * 10 ** 18) {
      // 1k+ KRC
      boostRate = 500; // 5% boost
    }

    userBenefits[user].yieldBoostRate = boostRate;
    emit YieldBoostUpdated(user, boostRate, block.timestamp);
  }

  /**
   * @dev Update governance power based on KRC holdings
   * @param user Address of the user
   */
  function updateGovernancePower(address user) external {
    uint256 balance = balanceOf(user);
    userBenefits[user].governancePower = balance;
  }

  /**
   * @dev Grant privilege access to user
   * @param user Address of the user
   * @param feature Feature to grant access to
   */
  function grantPrivilegeAccess(address user, string calldata feature) external onlyOwner {
    userBenefits[user].hasPrivilegeAccess = true;
    emit PrivilegeAccessGranted(user, feature, block.timestamp);
  }

  /**
   * @dev Start staking KRC tokens
   * @param amount Amount to stake
   * @param duration Staking duration in seconds
   */
  function startStaking(uint256 amount, uint256 duration) external validAmount(amount) validDuration(duration) nonReentrant whenNotPaused {
    require(balanceOf(msg.sender) >= amount, 'KRC: Insufficient balance');
    require(userBenefits[msg.sender].stakingAmount == 0, 'KRC: Already staking');
    require(amount >= MIN_STAKING_AMOUNT, 'KRC: Amount below minimum');

    // Transfer tokens to contract
    _transfer(msg.sender, address(this), amount);

    // Update staking info
    userBenefits[msg.sender].stakingAmount = amount;
    userBenefits[msg.sender].stakingStartTime = block.timestamp;
    userBenefits[msg.sender].stakingDuration = duration;

    totalStaked += amount;

    emit StakingStarted(msg.sender, amount, duration, block.timestamp);
  }

  /**
   * @dev End staking and claim rewards
   */
  function endStaking() external onlyStaker nonReentrant {
    UserBenefits storage user = userBenefits[msg.sender];
    require(block.timestamp >= user.stakingStartTime + user.stakingDuration, 'KRC: Staking period not ended');

    uint256 stakedAmount = user.stakingAmount;
    uint256 stakingTime = block.timestamp - user.stakingStartTime;
    uint256 rewards = calculateStakingRewards(stakedAmount, stakingTime);

    // Update balances
    totalStaked -= stakedAmount;
    totalStakingRewards += rewards;
    user.totalStakingRewards += rewards;
    user.stakingAmount = 0;
    user.stakingStartTime = 0;
    user.stakingDuration = 0;

    // Transfer staked amount + rewards back to user
    _transfer(address(this), msg.sender, stakedAmount + rewards);

    emit StakingEnded(msg.sender, stakedAmount, rewards, block.timestamp);
  }

  /**
   * @dev Create a governance proposal
   * @param title Proposal title
   * @param description Proposal description
   * @param duration Voting duration in seconds
   */
  function createProposal(string calldata title, string calldata description, uint256 duration) external {
    require(balanceOf(msg.sender) >= 10_000 * 10 ** 18, 'KRC: Insufficient balance to create proposal');
    require(duration >= 1 days && duration <= 7 days, 'KRC: Invalid voting duration');

    uint256 proposalId = nextProposalId++;
    proposals[proposalId] = Proposal({
      id: proposalId,
      title: title,
      description: description,
      startTime: block.timestamp,
      endTime: block.timestamp + duration,
      forVotes: 0,
      againstVotes: 0,
      executed: false,
      proposer: msg.sender
    });
  }

  /**
   * @dev Vote on a proposal
   * @param proposalId ID of the proposal
   * @param support Whether to support the proposal
   */
  function vote(uint256 proposalId, bool support) external {
    Proposal storage proposal = proposals[proposalId];
    require(proposal.id != 0, 'KRC: Proposal not found');
    require(block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime, 'KRC: Voting period not active');
    require(!hasVoted[msg.sender][proposalId], 'KRC: Already voted');
    require(balanceOf(msg.sender) > 0, 'KRC: No voting power');

    uint256 votes = balanceOf(msg.sender);
    hasVoted[msg.sender][proposalId] = true;

    if (support) {
      proposal.forVotes += votes;
    } else {
      proposal.againstVotes += votes;
    }

    emit GovernanceVoteCast(msg.sender, proposalId, support, votes, block.timestamp);
  }

  /**
   * @dev Execute a proposal (only if it passed)
   * @param proposalId ID of the proposal
   */
  function executeProposal(uint256 proposalId) external {
    Proposal storage proposal = proposals[proposalId];
    require(proposal.id != 0, 'KRC: Proposal not found');
    require(block.timestamp > proposal.endTime, 'KRC: Voting period not ended');
    require(!proposal.executed, 'KRC: Proposal already executed');
    require(proposal.forVotes > proposal.againstVotes, 'KRC: Proposal did not pass');

    proposal.executed = true;
    // In a real implementation, you would execute the proposal logic here
  }

  /**
   * @dev Calculate staking rewards
   * @param amount Staked amount
   * @param time Staking time in seconds
   * @return Rewards amount
   */
  function calculateStakingRewards(uint256 amount, uint256 time) public pure returns (uint256) {
    return (amount * STAKING_REWARD_RATE * time) / (10000 * 365 days);
  }

  /**
   * @dev Get user benefits
   * @param user Address of the user
   * @return benefits User benefits struct
   */
  function getUserBenefits(address user) external view returns (UserBenefits memory) {
    return userBenefits[user];
  }

  /**
   * @dev Get proposal details
   * @param proposalId ID of the proposal
   * @return proposal Proposal details
   */
  function getProposal(uint256 proposalId) external view returns (Proposal memory) {
    return proposals[proposalId];
  }

  /**
   * @dev Check if user has voted on proposal
   * @param user Address of the user
   * @param proposalId ID of the proposal
   * @return Whether user has voted
   */
  function hasUserVoted(address user, uint256 proposalId) external view returns (bool) {
    return hasVoted[user][proposalId];
  }

  /**
   * @dev Get fee discount for user
   * @param user Address of the user
   * @return Discount rate in basis points
   */
  function getFeeDiscount(address user) external view returns (uint256) {
    return userBenefits[user].feeDiscountRate;
  }

  /**
   * @dev Get yield boost for user
   * @param user Address of the user
   * @return Boost rate in basis points
   */
  function getYieldBoost(address user) external view returns (uint256) {
    return userBenefits[user].yieldBoostRate;
  }

  /**
   * @dev Check if user has privilege access
   * @param user Address of the user
   * @return Whether user has privilege access
   */
  function hasPrivilegeAccess(address user) external view returns (bool) {
    return userBenefits[user].hasPrivilegeAccess;
  }

  /**
   * @dev Override _update to handle pausing and burning
   */
  function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
    super._update(from, to, value);
  }

  /**
   * @dev Pause token transfers
   */
  function pause() external onlyOwner {
    _pause();
  }

  /**
   * @dev Unpause token transfers
   */
  function unpause() external onlyOwner {
    _unpause();
  }

  /**
   * @dev Emergency withdraw function for owner
   */
  function emergencyWithdraw() external onlyOwner {
    uint256 balance = balanceOf(address(this));
    if (balance > 0) {
      _transfer(address(this), owner(), balance);
    }
  }
}
