// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';

/**
 * @title KidsViewerVault
 * @dev Vault contract for parent deposits and reward distribution management
 * @notice This contract manages the reward pool and enforces daily reward limits per child
 */
contract KidsViewerVault is ReentrancyGuard, Ownable, Pausable {
  // Events
  event Deposit(address indexed parent, address indexed token, uint256 amount, uint256 timestamp);
  event Withdraw(address indexed parent, address indexed token, uint256 amount, uint256 timestamp);
  event RewardDistributed(address indexed child, address indexed token, uint256 amount, uint256 timestamp);
  event DailyLimitUpdated(address indexed child, address indexed token, uint256 newLimit, uint256 timestamp);
  event ParentAuthorized(address indexed parent, address indexed child, bool authorized, uint256 timestamp);

  // Structs
  struct ChildRewardConfig {
    uint256 dailyRewardLimit; // Daily reward limit for this child
    uint256 dailyRewardUsed; // Amount of rewards used today
    uint256 lastResetDate; // Last date when daily counter was reset
    bool isActive; // Whether this child can receive rewards
  }

  struct ParentConfig {
    mapping(address => bool) authorizedChildren; // Children this parent can manage
    mapping(address => uint256) tokenBalances; // Parent's token balances in vault
    bool isActive; // Whether this parent is active
  }

  // State variables
  mapping(address => ParentConfig) private parents;
  mapping(address => ChildRewardConfig) private childConfigs;
  mapping(address => bool) public supportedTokens; // Supported ERC20 tokens
  mapping(address => uint256) public totalVaultBalances; // Total vault balance per token

  // Constants
  uint256 public constant MAX_DAILY_LIMIT = 1000 * 10 ** 6; // Maximum 1000 USDC/USDT per day
  uint256 public constant MIN_DAILY_LIMIT = 1 * 10 ** 6; // Minimum 1 USDC/USDT per day

  // Modifiers
  modifier onlyParent() {
    require(parents[msg.sender].isActive, 'KidsViewerVault: Only authorized parents can call this function');
    _;
  }

  modifier onlyAuthorizedChild(address child) {
    require(parents[msg.sender].authorizedChildren[child], 'KidsViewerVault: Child not authorized by this parent');
    _;
  }

  modifier validToken(address token) {
    require(supportedTokens[token], 'KidsViewerVault: Token not supported');
    _;
  }

  modifier validAmount(uint256 amount) {
    require(amount > 0, 'KidsViewerVault: Amount must be greater than 0');
    _;
  }

  constructor() Ownable(msg.sender) {
    // Initialize with deployer as owner
  }

  /**
   * @dev Add a supported token to the vault
   * @param token Address of the ERC20 token
   */
  function addSupportedToken(address token) external onlyOwner {
    require(token != address(0), 'KidsViewerVault: Invalid token address');
    supportedTokens[token] = true;
  }

  /**
   * @dev Remove a supported token from the vault
   * @param token Address of the ERC20 token
   */
  function removeSupportedToken(address token) external onlyOwner {
    supportedTokens[token] = false;
  }

  /**
   * @dev Register a parent and activate their account
   * @param parent Address of the parent
   */
  function registerParent(address parent) external onlyOwner {
    require(parent != address(0), 'KidsViewerVault: Invalid parent address');
    parents[parent].isActive = true;
  }

  /**
   * @dev Authorize a child for a parent
   * @param child Address of the child
   * @param authorized Whether to authorize or revoke authorization
   */
  function authorizeChild(address child, bool authorized) external onlyParent {
    require(child != address(0), 'KidsViewerVault: Invalid child address');
    parents[msg.sender].authorizedChildren[child] = authorized;
    emit ParentAuthorized(msg.sender, child, authorized, block.timestamp);
  }

  /**
   * @dev Set daily reward limit for a child
   * @param child Address of the child
   * @param token Address of the token
   * @param dailyLimit Daily reward limit in token units
   */
  function setDailyRewardLimit(
    address child,
    address token,
    uint256 dailyLimit
  ) external onlyParent onlyAuthorizedChild(child) validToken(token) {
    require(dailyLimit >= MIN_DAILY_LIMIT && dailyLimit <= MAX_DAILY_LIMIT, 'KidsViewerVault: Daily limit out of range');

    childConfigs[child].dailyRewardLimit = dailyLimit;
    emit DailyLimitUpdated(child, token, dailyLimit, block.timestamp);
  }

  /**
   * @dev Deposit tokens to the vault (only parents)
   * @param token Address of the ERC20 token
   * @param amount Amount to deposit
   */
  function deposit(address token, uint256 amount) external onlyParent validToken(token) validAmount(amount) nonReentrant whenNotPaused {
    IERC20 tokenContract = IERC20(token);

    // Transfer tokens from parent to vault
    require(tokenContract.transferFrom(msg.sender, address(this), amount), 'KidsViewerVault: Transfer failed');

    // Update balances
    parents[msg.sender].tokenBalances[token] += amount;
    totalVaultBalances[token] += amount;

    emit Deposit(msg.sender, token, amount, block.timestamp);
  }

  /**
   * @dev Withdraw tokens from the vault (only parents)
   * @param token Address of the ERC20 token
   * @param amount Amount to withdraw
   */
  function withdraw(address token, uint256 amount) external onlyParent validToken(token) validAmount(amount) nonReentrant whenNotPaused {
    require(parents[msg.sender].tokenBalances[token] >= amount, 'KidsViewerVault: Insufficient balance');

    // Update balances
    parents[msg.sender].tokenBalances[token] -= amount;
    totalVaultBalances[token] -= amount;

    // Transfer tokens to parent
    IERC20 tokenContract = IERC20(token);
    require(tokenContract.transfer(msg.sender, amount), 'KidsViewerVault: Transfer failed');

    emit Withdraw(msg.sender, token, amount, block.timestamp);
  }

  /**
   * @dev Distribute reward to a child (only parents)
   * @param child Address of the child
   * @param token Address of the token
   * @param amount Amount to distribute as reward
   */
  function distributeReward(
    address child,
    address token,
    uint256 amount
  ) external onlyParent onlyAuthorizedChild(child) validToken(token) validAmount(amount) {
    // Check if child is active
    require(childConfigs[child].isActive, 'KidsViewerVault: Child not active');

    // Reset daily counter if needed
    _resetDailyCounterIfNeeded(child);

    // Check daily limit
    require(
      childConfigs[child].dailyRewardUsed + amount <= childConfigs[child].dailyRewardLimit,
      'KidsViewerVault: Daily reward limit exceeded'
    );

    // Check parent has sufficient balance
    require(parents[msg.sender].tokenBalances[token] >= amount, 'KidsViewerVault: Insufficient parent balance');

    // Update balances
    parents[msg.sender].tokenBalances[token] -= amount;
    childConfigs[child].dailyRewardUsed += amount;

    // Transfer to child's piggy bank (this would be called by the piggy bank contract)
    // For now, we emit an event and the piggy bank contract should listen to this
    emit RewardDistributed(child, token, amount, block.timestamp);
  }

  /**
   * @dev Get parent's token balance in vault
   * @param parent Address of the parent
   * @param token Address of the token
   * @return Balance amount
   */
  function getParentBalance(address parent, address token) external view returns (uint256) {
    return parents[parent].tokenBalances[token];
  }

  /**
   * @dev Get child's reward configuration
   * @param child Address of the child
   * @return dailyRewardLimit Daily reward limit
   * @return dailyRewardUsed Amount used today
   * @return lastResetDate Last reset date
   * @return isActive Whether child is active
   */
  function getChildConfig(
    address child
  ) external view returns (uint256 dailyRewardLimit, uint256 dailyRewardUsed, uint256 lastResetDate, bool isActive) {
    ChildRewardConfig memory config = childConfigs[child];
    return (config.dailyRewardLimit, config.dailyRewardUsed, config.lastResetDate, config.isActive);
  }

  /**
   * @dev Check if parent is authorized for child
   * @param parent Address of the parent
   * @param child Address of the child
   * @return Whether parent is authorized
   */
  function isParentAuthorized(address parent, address child) external view returns (bool) {
    return parents[parent].authorizedChildren[child];
  }

  /**
   * @dev Get total vault balance for a token
   * @param token Address of the token
   * @return Total balance in vault
   */
  function getTotalVaultBalance(address token) external view returns (uint256) {
    return totalVaultBalances[token];
  }

  /**
   * @dev Reset daily counter if a new day has started
   * @param child Address of the child
   */
  function _resetDailyCounterIfNeeded(address child) internal {
    uint256 today = block.timestamp / 1 days;
    if (childConfigs[child].lastResetDate < today) {
      childConfigs[child].dailyRewardUsed = 0;
      childConfigs[child].lastResetDate = today;
    }
  }

  /**
   * @dev Activate/deactivate a child
   * @param child Address of the child
   * @param active Whether to activate or deactivate
   */
  function setChildActive(address child, bool active) external onlyParent onlyAuthorizedChild(child) {
    childConfigs[child].isActive = active;
  }

  /**
   * @dev Emergency pause function
   */
  function pause() external onlyOwner {
    _pause();
  }

  /**
   * @dev Unpause function
   */
  function unpause() external onlyOwner {
    _unpause();
  }

  /**
   * @dev Emergency withdraw function for owner (only when paused)
   * @param token Address of the token
   * @param amount Amount to withdraw
   */
  function emergencyWithdraw(address token, uint256 amount) external onlyOwner whenPaused {
    IERC20 tokenContract = IERC20(token);
    require(tokenContract.transfer(owner(), amount), 'KidsViewerVault: Emergency transfer failed');
  }
}
