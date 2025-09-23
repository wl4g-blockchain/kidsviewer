// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';

/**
 * @title KidsViewerPiggyBank
 * @dev Piggy bank contract for children's rewards and DeFi investments
 * @notice This contract manages individual child savings and AAVE investments
 */
contract KidsViewerPiggyBank is ReentrancyGuard, Ownable, Pausable {
  // Events
  event RewardReceived(address indexed child, address indexed token, uint256 amount, uint256 timestamp);
  event WithdrawalRequested(address indexed child, address indexed token, uint256 amount, uint256 requestId, uint256 timestamp);
  event WithdrawalApproved(address indexed child, address indexed token, uint256 amount, uint256 requestId, uint256 timestamp);
  event WithdrawalRejected(address indexed child, address indexed token, uint256 amount, uint256 requestId, uint256 timestamp);
  event InvestmentMade(address indexed child, address indexed token, uint256 amount, address indexed aaveProduct, uint256 timestamp);
  event InvestmentRecovered(address indexed child, address indexed token, uint256 amount, uint256 timestamp);
  event ParentApprovalUpdated(address indexed parent, address indexed child, bool approved, uint256 timestamp);

  // Structs
  struct WithdrawalRequest {
    address child;
    address token;
    uint256 amount;
    uint256 requestId;
    uint256 timestamp;
    bool isApproved;
    bool isProcessed;
    string reason;
  }

  struct InvestmentConfig {
    bool isEnabled; // Whether DeFi investment is enabled for this child
    uint256 maxInvestmentAmount; // Maximum amount that can be invested
    uint256 totalInvested; // Total amount currently invested
    mapping(address => uint256) tokenInvestments; // Investment amount per token
    mapping(address => bool) approvedAaveProducts; // Approved AAVE products
  }

  struct ChildBalance {
    mapping(address => uint256) tokenBalances; // Token balances
    mapping(address => uint256) dailyEarnings; // Daily earnings per token
    mapping(address => uint256) totalEarnings; // Total earnings per token
    uint256 lastEarningsUpdate; // Last time earnings were updated
    bool isActive; // Whether child account is active
  }

  // State variables
  mapping(address => ChildBalance) private childBalances;
  mapping(address => InvestmentConfig) private investmentConfigs;
  mapping(address => mapping(address => bool)) private parentApprovals; // parent => child => approved
  mapping(uint256 => WithdrawalRequest) private withdrawalRequests;
  mapping(address => uint256[]) private childWithdrawalRequests; // child => requestIds

  address public vaultContract; // Address of the vault contract
  address public aaveLendingPool; // Address of AAVE lending pool
  uint256 private nextRequestId = 1; // Next withdrawal request ID

  // Constants
  uint256 public constant MAX_INVESTMENT_RATIO = 10000; // 100% in basis points
  uint256 public constant MIN_INVESTMENT_AMOUNT = 1 * 10 ** 6; // Minimum 1 USDC/USDT

  // Modifiers
  modifier onlyVault() {
    require(msg.sender == vaultContract, 'KidsViewerPiggyBank: Only vault can call this function');
    _;
  }

  modifier onlyAuthorizedParent(address child) {
    require(parentApprovals[msg.sender][child], 'KidsViewerPiggyBank: Parent not authorized for this child');
    _;
  }

  modifier validToken(address token) {
    require(token != address(0), 'KidsViewerPiggyBank: Invalid token address');
    _;
  }

  modifier validAmount(uint256 amount) {
    require(amount > 0, 'KidsViewerPiggyBank: Amount must be greater than 0');
    _;
  }

  constructor(address _vaultContract, address _aaveLendingPool) Ownable(msg.sender) {
    vaultContract = _vaultContract;
    aaveLendingPool = _aaveLendingPool;
  }

  /**
   * @dev Receive reward from vault contract
   * @param child Address of the child
   * @param token Address of the token
   * @param amount Amount of reward
   */
  function receiveReward(address child, address token, uint256 amount) external onlyVault validToken(token) validAmount(amount) {
    require(childBalances[child].isActive, 'KidsViewerPiggyBank: Child not active');

    // Update child's balance
    childBalances[child].tokenBalances[token] += amount;

    // Update earnings (simplified - in real implementation, this would be more complex)
    _updateEarnings(child, token);

    emit RewardReceived(child, token, amount, block.timestamp);
  }

  /**
   * @dev Request withdrawal (child can call this)
   * @param token Address of the token
   * @param amount Amount to withdraw
   * @param reason Reason for withdrawal
   */
  function requestWithdrawal(
    address token,
    uint256 amount,
    string calldata reason
  ) external validToken(token) validAmount(amount) whenNotPaused {
    require(childBalances[msg.sender].isActive, 'KidsViewerPiggyBank: Child not active');
    require(childBalances[msg.sender].tokenBalances[token] >= amount, 'KidsViewerPiggyBank: Insufficient balance');

    uint256 requestId = nextRequestId++;

    withdrawalRequests[requestId] = WithdrawalRequest({
      child: msg.sender,
      token: token,
      amount: amount,
      requestId: requestId,
      timestamp: block.timestamp,
      isApproved: false,
      isProcessed: false,
      reason: reason
    });

    childWithdrawalRequests[msg.sender].push(requestId);

    emit WithdrawalRequested(msg.sender, token, amount, requestId, block.timestamp);
  }

  /**
   * @dev Approve withdrawal request (parent can call this)
   * @param requestId ID of the withdrawal request
   */
  function approveWithdrawal(uint256 requestId) external nonReentrant {
    WithdrawalRequest storage request = withdrawalRequests[requestId];
    require(request.child != address(0), 'KidsViewerPiggyBank: Request not found');
    require(!request.isProcessed, 'KidsViewerPiggyBank: Request already processed');
    require(parentApprovals[msg.sender][request.child], 'KidsViewerPiggyBank: Parent not authorized');

    request.isApproved = true;
    request.isProcessed = true;

    // Transfer tokens to child
    childBalances[request.child].tokenBalances[request.token] -= request.amount;

    IERC20 tokenContract = IERC20(request.token);
    require(tokenContract.transfer(request.child, request.amount), 'KidsViewerPiggyBank: Transfer failed');

    emit WithdrawalApproved(request.child, request.token, request.amount, requestId, block.timestamp);
  }

  /**
   * @dev Reject withdrawal request (parent can call this)
   * @param requestId ID of the withdrawal request
   * @param reason Reason for rejection
   */
  function rejectWithdrawal(uint256 requestId, string calldata reason) external {
    WithdrawalRequest storage request = withdrawalRequests[requestId];
    require(request.child != address(0), 'KidsViewerPiggyBank: Request not found');
    require(!request.isProcessed, 'KidsViewerPiggyBank: Request already processed');
    require(parentApprovals[msg.sender][request.child], 'KidsViewerPiggyBank: Parent not authorized');

    request.isProcessed = true;
    request.reason = reason;

    emit WithdrawalRejected(request.child, request.token, request.amount, requestId, block.timestamp);
  }

  /**
   * @dev Invest in AAVE (child can call this if parent approved)
   * @param token Address of the token
   * @param amount Amount to invest
   * @param aaveProduct Address of the AAVE product
   */
  function investInAave(address token, uint256 amount, address aaveProduct) external validToken(token) validAmount(amount) whenNotPaused {
    require(childBalances[msg.sender].isActive, 'KidsViewerPiggyBank: Child not active');
    require(investmentConfigs[msg.sender].isEnabled, 'KidsViewerPiggyBank: Investment not enabled');
    require(investmentConfigs[msg.sender].approvedAaveProducts[aaveProduct], 'KidsViewerPiggyBank: AAVE product not approved');
    require(childBalances[msg.sender].tokenBalances[token] >= amount, 'KidsViewerPiggyBank: Insufficient balance');
    require(amount >= MIN_INVESTMENT_AMOUNT, 'KidsViewerPiggyBank: Amount too small');
    require(
      investmentConfigs[msg.sender].totalInvested + amount <= investmentConfigs[msg.sender].maxInvestmentAmount,
      'KidsViewerPiggyBank: Investment limit exceeded'
    );

    // Update balances
    childBalances[msg.sender].tokenBalances[token] -= amount;
    investmentConfigs[msg.sender].tokenInvestments[token] += amount;
    investmentConfigs[msg.sender].totalInvested += amount;

    // In a real implementation, this would interact with AAVE protocol
    // For now, we just emit an event
    emit InvestmentMade(msg.sender, token, amount, aaveProduct, block.timestamp);
  }

  /**
   * @dev Recover all investments (parent can call this)
   * @param child Address of the child
   * @param token Address of the token
   */
  function recoverAllInvestments(address child, address token) external onlyAuthorizedParent(child) validToken(token) nonReentrant {
    require(investmentConfigs[child].isEnabled, 'KidsViewerPiggyBank: Investment not enabled');

    uint256 investedAmount = investmentConfigs[child].tokenInvestments[token];
    require(investedAmount > 0, 'KidsViewerPiggyBank: No investments to recover');

    // Update balances
    childBalances[child].tokenBalances[token] += investedAmount;
    investmentConfigs[child].tokenInvestments[token] = 0;
    investmentConfigs[child].totalInvested -= investedAmount;

    // In a real implementation, this would withdraw from AAVE protocol
    emit InvestmentRecovered(child, token, investedAmount, block.timestamp);
  }

  /**
   * @dev Set parent approval for child
   * @param child Address of the child
   * @param approved Whether to approve or revoke approval
   */
  function setParentApproval(address child, bool approved) external {
    require(child != address(0), 'KidsViewerPiggyBank: Invalid child address');
    parentApprovals[msg.sender][child] = approved;
    emit ParentApprovalUpdated(msg.sender, child, approved, block.timestamp);
  }

  /**
   * @dev Enable/disable investment for child (parent can call this)
   * @param child Address of the child
   * @param enabled Whether to enable investment
   * @param maxAmount Maximum investment amount
   */
  function setInvestmentConfig(address child, bool enabled, uint256 maxAmount) external onlyAuthorizedParent(child) {
    investmentConfigs[child].isEnabled = enabled;
    investmentConfigs[child].maxInvestmentAmount = maxAmount;
  }

  /**
   * @dev Approve AAVE product for child (parent can call this)
   * @param child Address of the child
   * @param aaveProduct Address of the AAVE product
   * @param approved Whether to approve or revoke approval
   */
  function setAaveProductApproval(address child, address aaveProduct, bool approved) external onlyAuthorizedParent(child) {
    investmentConfigs[child].approvedAaveProducts[aaveProduct] = approved;
  }

  /**
   * @dev Activate/deactivate child account
   * @param child Address of the child
   * @param active Whether to activate or deactivate
   */
  function setChildActive(address child, bool active) external onlyOwner {
    childBalances[child].isActive = active;
  }

  /**
   * @dev Get child's token balance
   * @param child Address of the child
   * @param token Address of the token
   * @return Balance amount
   */
  function getChildBalance(address child, address token) external view returns (uint256) {
    return childBalances[child].tokenBalances[token];
  }

  /**
   * @dev Get child's earnings
   * @param child Address of the child
   * @param token Address of the token
   * @return dailyEarnings Daily earnings
   * @return totalEarnings Total earnings
   */
  function getChildEarnings(address child, address token) external view returns (uint256 dailyEarnings, uint256 totalEarnings) {
    return (childBalances[child].dailyEarnings[token], childBalances[child].totalEarnings[token]);
  }

  /**
   * @dev Get withdrawal request details
   * @param requestId ID of the request
   * @return request Withdrawal request details
   */
  function getWithdrawalRequest(uint256 requestId) external view returns (WithdrawalRequest memory) {
    return withdrawalRequests[requestId];
  }

  /**
   * @dev Get child's withdrawal requests
   * @param child Address of the child
   * @return requestIds Array of request IDs
   */
  function getChildWithdrawalRequests(address child) external view returns (uint256[] memory) {
    return childWithdrawalRequests[child];
  }

  /**
   * @dev Get investment configuration for child
   * @param child Address of the child
   * @return isEnabled Whether investment is enabled
   * @return maxInvestmentAmount Maximum investment amount
   * @return totalInvested Total amount invested
   */
  function getInvestmentConfig(address child) external view returns (bool isEnabled, uint256 maxInvestmentAmount, uint256 totalInvested) {
    InvestmentConfig storage config = investmentConfigs[child];
    return (config.isEnabled, config.maxInvestmentAmount, config.totalInvested);
  }

  /**
   * @dev Check if AAVE product is approved for child
   * @param child Address of the child
   * @param aaveProduct Address of the AAVE product
   * @return Whether product is approved
   */
  function isAaveProductApproved(address child, address aaveProduct) external view returns (bool) {
    return investmentConfigs[child].approvedAaveProducts[aaveProduct];
  }

  /**
   * @dev Update earnings (simplified implementation)
   * @param child Address of the child
   * @param token Address of the token
   */
  function _updateEarnings(address child, address token) internal {
    // In a real implementation, this would calculate actual earnings from investments
    // For now, we'll use a simple formula based on time and balance
    uint256 currentTime = block.timestamp;
    uint256 timeDiff = currentTime - childBalances[child].lastEarningsUpdate;

    if (timeDiff > 0) {
      // Simple earnings calculation: 0.01% per hour
      uint256 balance = childBalances[child].tokenBalances[token];
      uint256 earnings = (balance * timeDiff * 1) / (10000 * 3600); // 0.01% per hour

      childBalances[child].dailyEarnings[token] += earnings;
      childBalances[child].totalEarnings[token] += earnings;
      childBalances[child].lastEarningsUpdate = currentTime;
    }
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
}
