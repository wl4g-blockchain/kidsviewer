// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title KidsViewerPiggyBank
 * @dev Piggy bank contract for children's rewards and DeFi investments
 * @notice This contract manages individual child savings and AAVE investments
 */
contract KidsViewerPiggyBank is Ownable {
  // Events
  event RewardReceived(address indexed child, address indexed token, uint256 amount, uint256 timestamp);
  event WithdrawalRequested(
    address indexed child,
    address indexed token,
    uint256 amount,
    string reason,
    uint256 requestId,
    uint256 timestamp
  );
  event WithdrawalApproved(address indexed child, uint256 requestId, uint256 timestamp);
  event WithdrawalRejected(address indexed child, uint256 requestId, string reason, uint256 timestamp);
  event InvestmentMade(address indexed child, address indexed token, uint256 amount, address indexed aaveProduct, uint256 timestamp);
  event InvestmentRecovered(address indexed child, address indexed token, uint256 amount, uint256 timestamp);
  event ParentApprovalUpdated(address indexed parent, address indexed child, bool approved, uint256 timestamp);
  event InvestmentConfigUpdated(address indexed child, bool enabled, uint256 maxAmount, uint256 timestamp);
  event AaveProductApprovalUpdated(address indexed child, address indexed aaveProduct, bool approved, uint256 timestamp);

  // Structs
  struct WithdrawalRequest {
    address child;
    address token;
    uint256 amount;
    uint64 timestamp;
    bool approved;
    bool executed;
    string reason;
  }

  // State variables
  bool public paused;
  uint256 public nextRequestId;

  mapping(address => mapping(address => uint256)) public childBalances; // child => token => balance
  mapping(address => mapping(address => uint256)) public childEarnings; // child => token => earnings
  mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
  mapping(address => uint256) public childRequestIds; // child => requestId
  mapping(address => mapping(address => bool)) public parentApprovals; // parent => child => approved
  mapping(address => bool) public investmentConfigs; // child => enabled
  mapping(address => uint256) public maxInvestmentAmounts; // child => maxAmount
  mapping(address => uint256) public totalInvested; // child => totalInvested
  mapping(address => mapping(address => bool)) public aaveProductApprovals; // child => aaveProduct => approved
  mapping(address => bool) public childActive;

  // Modifiers
  modifier whenNotPaused() {
    require(!paused, 'KidsViewerPiggyBank: Paused');
    _;
  }

  modifier onlyParent(address child) {
    require(parentApprovals[msg.sender][child], 'KidsViewerPiggyBank: Not parent');
    _;
  }

  modifier validAmount(uint256 amount) {
    require(amount > 0, 'KidsViewerPiggyBank: Amount > 0');
    _;
  }

  constructor() Ownable(msg.sender) {
    nextRequestId = 1;
  }

  /**
   * @dev Receive reward from vault contract
   * @param child Address of the child
   * @param token Address of the token
   * @param amount Amount of reward
   */
  function receiveReward(address child, address token, uint256 amount) external whenNotPaused validAmount(amount) onlyParent(child) {
    childBalances[child][token] += amount;
    childEarnings[child][token] += amount;

    emit RewardReceived(child, token, amount, block.timestamp);
  }

  /**
   * @dev Request withdrawal (child can call this)
   * @param token Address of the token
   * @param amount Amount to withdraw
   * @param reason Reason for withdrawal
   */
  function requestWithdrawal(address token, uint256 amount, string calldata reason) external whenNotPaused validAmount(amount) {
    require(childBalances[msg.sender][token] >= amount, 'KidsViewerPiggyBank: Insufficient');

    uint256 requestId = nextRequestId++;
    withdrawalRequests[requestId] = WithdrawalRequest({
      child: msg.sender,
      token: token,
      amount: amount,
      timestamp: uint64(block.timestamp),
      approved: false,
      executed: false,
      reason: reason
    });

    childRequestIds[msg.sender] = requestId;
    nextRequestId++;

    emit WithdrawalRequested(msg.sender, token, amount, reason, requestId, block.timestamp);
  }

  /**
   * @dev Approve withdrawal request (parent can call this)
   * @param requestId ID of the withdrawal request
   */
  function approveWithdrawal(uint256 requestId) external onlyOwner whenNotPaused {
    WithdrawalRequest storage request = withdrawalRequests[requestId];
    require(!request.approved, 'KidsViewerPiggyBank: Already approved');
    require(!request.executed, 'KidsViewerPiggyBank: Already executed');

    request.approved = true;
    childBalances[request.child][request.token] -= request.amount;

    emit WithdrawalApproved(request.child, requestId, block.timestamp);
  }

  /**
   * @dev Reject withdrawal request (parent can call this)
   * @param requestId ID of the withdrawal request
   * @param reason Reason for rejection
   */
  function rejectWithdrawal(uint256 requestId, string calldata reason) external whenNotPaused {
    WithdrawalRequest storage request = withdrawalRequests[requestId];
    require(!request.approved, 'KidsViewerPiggyBank: Already approved');
    require(!request.executed, 'KidsViewerPiggyBank: Already executed');

    request.executed = true;
    request.reason = reason;

    emit WithdrawalRejected(request.child, requestId, reason, block.timestamp);
  }

  /**
   * @dev Invest in AAVE (child can call this if parent approved)
   * @param token Address of the token
   * @param amount Amount to invest
   * @param aaveProduct Address of the AAVE product
   */
  function investInAave(address token, uint256 amount, address aaveProduct) external whenNotPaused validAmount(amount) {
    require(childBalances[msg.sender][token] >= amount, 'KidsViewerPiggyBank: Insufficient');

    childBalances[msg.sender][token] -= amount;

    emit InvestmentMade(msg.sender, token, amount, aaveProduct, block.timestamp);
  }

  /**
   * @dev Recover all investments (parent can call this)
   * @param child Address of the child
   * @param token Address of the token
   */
  function recoverAllInvestments(address child, address token) external onlyParent(child) whenNotPaused {
    uint256 recoveredAmount = childBalances[child][token];
    childBalances[child][token] = 0;

    emit InvestmentRecovered(child, token, recoveredAmount, block.timestamp);
  }

  /**
   * @dev Set parent approval for child
   * @param child Address of the child
   * @param approved Whether to approve or revoke approval
   */
  function setParentApproval(address child, bool approved) external {
    parentApprovals[msg.sender][child] = approved;
    emit ParentApprovalUpdated(msg.sender, child, approved, block.timestamp);
  }

  /**
   * @dev Enable/disable investment for child (parent can call this)
   * @param child Address of the child
   * @param enabled Whether to enable investment
   * @param maxAmount Maximum investment amount
   */
  function setInvestmentConfig(address child, bool enabled, uint256 maxAmount) external onlyParent(child) {
    investmentConfigs[child] = enabled;
    maxInvestmentAmounts[child] = maxAmount;
    totalInvested[child] = 0;

    emit InvestmentConfigUpdated(child, enabled, maxAmount, block.timestamp);
  }

  /**
   * @dev Approve AAVE product for child (parent can call this)
   * @param child Address of the child
   * @param aaveProduct Address of the AAVE product
   * @param approved Whether to approve or revoke approval
   */
  function setAaveProductApproval(address child, address aaveProduct, bool approved) external onlyParent(child) {
    aaveProductApprovals[child][aaveProduct] = approved;
    emit AaveProductApprovalUpdated(child, aaveProduct, approved, block.timestamp);
  }

  /**
   * @dev Activate/deactivate child account
   * @param child Address of the child
   * @param active Whether to activate or deactivate
   */
  function setChildActive(address child, bool active) external onlyOwner {
    childActive[child] = active;
  }

  /**
   * @dev Pause contract
   */
  function pause() external onlyOwner {
    paused = true;
  }

  /**
   * @dev Unpause contract
   */
  function unpause() external onlyOwner {
    paused = false;
  }

  /**
   * @dev Get child's token balance
   * @param child Address of the child
   * @param token Address of the token
   * @return Balance amount
   */
  function getChildBalance(address child, address token) external view returns (uint256) {
    return childBalances[child][token];
  }

  /**
   * @dev Get child's earnings
   * @param child Address of the child
   * @param token Address of the token
   * @return balance Balance amount
   * @return earnings Earnings amount
   */
  function getChildEarnings(address child, address token) external view returns (uint256 balance, uint256 earnings) {
    return (childBalances[child][token], childEarnings[child][token]);
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
   * @return requestId Request ID
   */
  function getChildWithdrawalRequests(address child) external view returns (uint256) {
    return childRequestIds[child];
  }

  /**
   * @dev Get investment configuration for child
   * @param child Address of the child
   * @return isEnabled Whether investment is enabled
   * @return maxInvestmentAmount Maximum investment amount
   * @return totalInvestedAmount Total amount invested
   */
  function getInvestmentConfig(
    address child
  ) external view returns (bool isEnabled, uint256 maxInvestmentAmount, uint256 totalInvestedAmount) {
    return (investmentConfigs[child], maxInvestmentAmounts[child], totalInvested[child]);
  }

  /**
   * @dev Check if AAVE product is approved for child
   * @param child Address of the child
   * @param aaveProduct Address of the AAVE product
   * @return Whether product is approved
   */
  function isAaveProductApproved(address child, address aaveProduct) external view returns (bool) {
    return aaveProductApprovals[child][aaveProduct];
  }

  /**
   * @dev Check if parent is approved for child
   * @param parent Address of the parent
   * @param child Address of the child
   * @return Whether parent is approved
   */
  function isParentApproved(address parent, address child) external view returns (bool) {
    return parentApprovals[parent][child];
  }

  /**
   * @dev Check if child is active
   * @param child Address of the child
   * @return Whether child is active
   */
  function isChildActive(address child) external view returns (bool) {
    return childActive[child];
  }
}
