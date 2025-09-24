// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import 'forge-std/Test.sol';
import '../src/bank/KidsViewerPiggyBank.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract KidsViewerPiggyBankTest is Test {
  KidsViewerPiggyBank public piggyBank;
  address public owner = address(0x1);
  address public parent1 = address(0x2);
  address public parent2 = address(0x3);
  address public child1 = address(0x4);
  address public child2 = address(0x5);
  address public token1 = address(0x6);
  address public token2 = address(0x7);
  address public aaveProduct1 = address(0x8);

  function setUp() public {
    vm.prank(owner);
    piggyBank = new KidsViewerPiggyBank();
  }

  function testInitialState() public {
    assertEq(piggyBank.owner(), owner);
    assertFalse(piggyBank.paused());
    assertEq(piggyBank.nextRequestId(), 1);
  }

  function testReceiveReward() public {
    uint256 rewardAmount = 1000 * 10 ** 6;

    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, rewardAmount);

    assertEq(piggyBank.childBalances(child1, token1), rewardAmount);
    assertEq(piggyBank.childEarnings(child1, token1), rewardAmount);
  }

  function testReceiveRewardRevertsWhenPaused() public {
    uint256 rewardAmount = 1000 * 10 ** 6;

    vm.prank(owner);
    piggyBank.pause();

    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    vm.expectRevert('KidsViewerPiggyBank: Paused');
    piggyBank.receiveReward(child1, token1, rewardAmount);
  }

  function testReceiveRewardRevertsWhenAmountZero() public {
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    vm.expectRevert('KidsViewerPiggyBank: Amount > 0');
    piggyBank.receiveReward(child1, token1, 0);
  }

  function testReceiveRewardRevertsWhenNotParent() public {
    uint256 rewardAmount = 1000 * 10 ** 6;

    vm.prank(parent1);
    vm.expectRevert('KidsViewerPiggyBank: Not parent');
    piggyBank.receiveReward(child1, token1, rewardAmount);
  }

  function testRequestWithdrawal() public {
    uint256 amount = 500 * 10 ** 6;
    string memory reason = 'Need money for school supplies';

    // First give child some balance
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, 1000 * 10 ** 6);

    // Then request withdrawal
    vm.prank(child1);
    piggyBank.requestWithdrawal(token1, amount, reason);

    assertEq(piggyBank.childRequestIds(child1), 1);

    KidsViewerPiggyBank.WithdrawalRequest memory request = piggyBank.getWithdrawalRequest(1);
    assertEq(request.child, child1);
    assertEq(request.token, token1);
    assertEq(request.amount, amount);
    assertEq(request.reason, reason);
    assertFalse(request.approved);
    assertFalse(request.executed);
  }

  function testRequestWithdrawalRevertsWhenPaused() public {
    uint256 amount = 500 * 10 ** 6;
    string memory reason = 'Need money for school supplies';

    vm.prank(owner);
    piggyBank.pause();

    vm.prank(child1);
    vm.expectRevert('KidsViewerPiggyBank: Paused');
    piggyBank.requestWithdrawal(token1, amount, reason);
  }

  function testRequestWithdrawalRevertsWhenAmountZero() public {
    string memory reason = 'Need money for school supplies';

    vm.prank(child1);
    vm.expectRevert('KidsViewerPiggyBank: Amount > 0');
    piggyBank.requestWithdrawal(token1, 0, reason);
  }

  function testRequestWithdrawalRevertsWhenInsufficientBalance() public {
    uint256 amount = 500 * 10 ** 6;
    string memory reason = 'Need money for school supplies';

    vm.prank(child1);
    vm.expectRevert('KidsViewerPiggyBank: Insufficient');
    piggyBank.requestWithdrawal(token1, amount, reason);
  }

  function testApproveWithdrawal() public {
    uint256 amount = 500 * 10 ** 6;
    string memory reason = 'Need money for school supplies';

    // Setup: parent approval and child balance
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, 1000 * 10 ** 6);

    // Request withdrawal
    vm.prank(child1);
    piggyBank.requestWithdrawal(token1, amount, reason);

    // Approve withdrawal
    vm.prank(owner);
    piggyBank.approveWithdrawal(1);

    KidsViewerPiggyBank.WithdrawalRequest memory request = piggyBank.getWithdrawalRequest(1);
    assertTrue(request.approved);
    assertEq(piggyBank.childBalances(child1, token1), 1000 * 10 ** 6 - amount);
  }

  function testApproveWithdrawalRevertsWhenNotOwner() public {
    uint256 amount = 500 * 10 ** 6;
    string memory reason = 'Need money for school supplies';

    // Setup
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, 1000 * 10 ** 6);

    vm.prank(child1);
    piggyBank.requestWithdrawal(token1, amount, reason);

    vm.prank(parent1);
    vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, parent1));
    piggyBank.approveWithdrawal(1);
  }

  function testApproveWithdrawalRevertsWhenPaused() public {
    uint256 amount = 500 * 10 ** 6;
    string memory reason = 'Need money for school supplies';

    // Setup
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, 1000 * 10 ** 6);

    vm.prank(child1);
    piggyBank.requestWithdrawal(token1, amount, reason);

    vm.prank(owner);
    piggyBank.pause();

    vm.prank(owner);
    vm.expectRevert('KidsViewerPiggyBank: Paused');
    piggyBank.approveWithdrawal(1);
  }

  function testRejectWithdrawal() public {
    uint256 amount = 500 * 10 ** 6;
    string memory reason = 'Need money for school supplies';
    string memory rejectionReason = 'Not a valid reason';

    // Setup
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, 1000 * 10 ** 6);

    vm.prank(child1);
    piggyBank.requestWithdrawal(token1, amount, reason);

    // Reject withdrawal
    vm.prank(owner);
    piggyBank.rejectWithdrawal(1, rejectionReason);

    KidsViewerPiggyBank.WithdrawalRequest memory request = piggyBank.getWithdrawalRequest(1);
    assertFalse(request.approved);
    assertTrue(request.executed);
    assertEq(request.reason, rejectionReason);
  }

  function testInvestInAave() public {
    uint256 amount = 500 * 10 ** 6;

    // Setup: give child some balance
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, 1000 * 10 ** 6);

    // Invest
    vm.prank(child1);
    piggyBank.investInAave(token1, amount, aaveProduct1);

    assertEq(piggyBank.childBalances(child1, token1), 1000 * 10 ** 6 - amount);
  }

  function testInvestInAaveRevertsWhenPaused() public {
    uint256 amount = 500 * 10 ** 6;

    vm.prank(owner);
    piggyBank.pause();

    vm.prank(child1);
    vm.expectRevert('KidsViewerPiggyBank: Paused');
    piggyBank.investInAave(token1, amount, aaveProduct1);
  }

  function testInvestInAaveRevertsWhenAmountZero() public {
    vm.prank(child1);
    vm.expectRevert('KidsViewerPiggyBank: Amount > 0');
    piggyBank.investInAave(token1, 0, aaveProduct1);
  }

  function testInvestInAaveRevertsWhenInsufficientBalance() public {
    uint256 amount = 500 * 10 ** 6;

    vm.prank(child1);
    vm.expectRevert('KidsViewerPiggyBank: Insufficient');
    piggyBank.investInAave(token1, amount, aaveProduct1);
  }

  function testRecoverAllInvestments() public {
    uint256 amount = 500 * 10 ** 6;

    // Setup: give child some balance
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, amount);

    // Recover investments
    vm.prank(parent1);
    piggyBank.recoverAllInvestments(child1, token1);

    assertEq(piggyBank.childBalances(child1, token1), 0);
  }

  function testRecoverAllInvestmentsRevertsWhenNotParent() public {
    vm.prank(parent2);
    vm.expectRevert('KidsViewerPiggyBank: Not parent');
    piggyBank.recoverAllInvestments(child1, token1);
  }

  function testSetParentApproval() public {
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    assertTrue(piggyBank.parentApprovals(parent1, child1));
  }

  function testSetInvestmentConfig() public {
    bool enabled = true;
    uint256 maxAmount = 10000 * 10 ** 6;

    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.setInvestmentConfig(child1, enabled, maxAmount);

    (bool isEnabled, uint256 maxInvestmentAmount, uint256 totalInvested) = piggyBank.getInvestmentConfig(child1);
    assertTrue(isEnabled);
    assertEq(maxInvestmentAmount, maxAmount);
    assertEq(totalInvested, 0);
  }

  function testSetInvestmentConfigRevertsWhenNotParent() public {
    bool enabled = true;
    uint256 maxAmount = 10000 * 10 ** 6;

    vm.prank(parent1);
    vm.expectRevert('KidsViewerPiggyBank: Not parent');
    piggyBank.setInvestmentConfig(child1, enabled, maxAmount);
  }

  function testSetAaveProductApproval() public {
    bool approved = true;

    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.setAaveProductApproval(child1, aaveProduct1, approved);

    assertTrue(piggyBank.aaveProductApprovals(child1, aaveProduct1));
  }

  function testSetAaveProductApprovalRevertsWhenNotParent() public {
    bool approved = true;

    vm.prank(parent1);
    vm.expectRevert('KidsViewerPiggyBank: Not parent');
    piggyBank.setAaveProductApproval(child1, aaveProduct1, approved);
  }

  function testSetChildActive() public {
    vm.prank(owner);
    piggyBank.setChildActive(child1, true);

    assertTrue(piggyBank.childActive(child1));
  }

  function testSetChildActiveRevertsWhenNotOwner() public {
    vm.prank(parent1);
    vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, parent1));
    piggyBank.setChildActive(child1, true);
  }

  function testPause() public {
    vm.prank(owner);
    piggyBank.pause();

    assertTrue(piggyBank.paused());
  }

  function testUnpause() public {
    vm.prank(owner);
    piggyBank.pause();

    vm.prank(owner);
    piggyBank.unpause();

    assertFalse(piggyBank.paused());
  }

  function testGetChildBalance() public {
    uint256 amount = 1000 * 10 ** 6;

    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, amount);

    assertEq(piggyBank.getChildBalance(child1, token1), amount);
  }

  function testGetChildEarnings() public {
    uint256 amount = 1000 * 10 ** 6;

    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, amount);

    (uint256 balance, uint256 earnings) = piggyBank.getChildEarnings(child1, token1);
    assertEq(balance, amount);
    assertEq(earnings, amount);
  }

  function testGetWithdrawalRequest() public {
    uint256 amount = 500 * 10 ** 6;
    string memory reason = 'Need money for school supplies';

    // Setup
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, 1000 * 10 ** 6);

    vm.prank(child1);
    piggyBank.requestWithdrawal(token1, amount, reason);

    KidsViewerPiggyBank.WithdrawalRequest memory request = piggyBank.getWithdrawalRequest(1);
    assertEq(request.child, child1);
    assertEq(request.token, token1);
    assertEq(request.amount, amount);
    assertEq(request.reason, reason);
  }

  function testGetChildWithdrawalRequests() public {
    uint256 amount = 500 * 10 ** 6;
    string memory reason = 'Need money for school supplies';

    // Setup
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.receiveReward(child1, token1, 1000 * 10 ** 6);

    vm.prank(child1);
    piggyBank.requestWithdrawal(token1, amount, reason);

    assertEq(piggyBank.getChildWithdrawalRequests(child1), 1);
  }

  function testIsAaveProductApproved() public {
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    vm.prank(parent1);
    piggyBank.setAaveProductApproval(child1, aaveProduct1, true);

    assertTrue(piggyBank.isAaveProductApproved(child1, aaveProduct1));
    assertFalse(piggyBank.isAaveProductApproved(child1, address(uint160(aaveProduct1) + 1)));
  }

  function testIsParentApproved() public {
    vm.prank(parent1);
    piggyBank.setParentApproval(child1, true);

    assertTrue(piggyBank.isParentApproved(parent1, child1));
    assertFalse(piggyBank.isParentApproved(parent2, child1));
  }

  function testIsChildActive() public {
    vm.prank(owner);
    piggyBank.setChildActive(child1, true);

    assertTrue(piggyBank.isChildActive(child1));
    assertFalse(piggyBank.isChildActive(child2));
  }
}
