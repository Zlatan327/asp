// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BountyPool
 * @dev Manages a pool of tokens that can be claimed by verified participants.
 * Designed for Social Micro-Bounties where a central backend verifies a ZK Proof
 * and then signs a payload allowing the user to claim.
 */
contract BountyPool is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;
    address public backendVerifier;

    struct Pool {
        address creator;
        uint256 totalAmount;
        uint256 rewardPerClaim;
        uint256 claimsPaid;
        bool isActive;
    }

    // Mapping from bountyId (string) to Pool
    mapping(string => Pool) public pools;
    // Mapping from bountyId -> (userAddress => bool) to prevent double claims
    mapping(string => mapping(address => bool)) public hasClaimed;

    event PoolCreated(string bountyId, address indexed creator, uint256 totalAmount, uint256 rewardPerClaim);
    event BountyClaimed(string bountyId, address indexed user, uint256 amount);
    event PoolCancelled(string bountyId, address indexed creator, uint256 refundAmount);
    event VerifierUpdated(address newVerifier);

    constructor(address _paymentToken, address _backendVerifier) Ownable(msg.sender) {
        require(_paymentToken != address(0), "Invalid token");
        require(_backendVerifier != address(0), "Invalid verifier");
        paymentToken = IERC20(_paymentToken);
        backendVerifier = _backendVerifier;
    }

    function setBackendVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Invalid verifier");
        backendVerifier = _newVerifier;
        emit VerifierUpdated(_newVerifier);
    }

    function createPool(string calldata bountyId, uint256 totalAmount, uint256 rewardPerClaim) external whenNotPaused {
        require(totalAmount > 0, "Amount must be > 0");
        require(rewardPerClaim > 0 && rewardPerClaim <= totalAmount, "Invalid reward amount");
        require(pools[bountyId].totalAmount == 0, "Pool already exists");

        paymentToken.safeTransferFrom(msg.sender, address(this), totalAmount);

        pools[bountyId] = Pool({
            creator: msg.sender,
            totalAmount: totalAmount,
            rewardPerClaim: rewardPerClaim,
            claimsPaid: 0,
            isActive: true
        });

        emit PoolCreated(bountyId, msg.sender, totalAmount, rewardPerClaim);
    }

    // For the hackathon demo, the backend can directly call this when the ZK proof is validated.
    // In production, we would use EIP-712 signatures.
    function distributeReward(string calldata bountyId, address user) external {
        require(msg.sender == backendVerifier || msg.sender == owner(), "Only verifier can distribute");
        Pool storage pool = pools[bountyId];
        require(pool.isActive, "Pool is not active");
        require(!hasClaimed[bountyId][user], "User already claimed");
        require(pool.totalAmount - (pool.claimsPaid * pool.rewardPerClaim) >= pool.rewardPerClaim, "Pool depleted");

        hasClaimed[bountyId][user] = true;
        pool.claimsPaid++;

        paymentToken.safeTransfer(user, pool.rewardPerClaim);
        emit BountyClaimed(bountyId, user, pool.rewardPerClaim);
    }

    function cancelPool(string calldata bountyId) external nonReentrant {
        Pool storage pool = pools[bountyId];
        require(msg.sender == pool.creator || msg.sender == owner(), "Not authorized");
        require(pool.isActive, "Pool not active");

        pool.isActive = false;
        uint256 remaining = pool.totalAmount - (pool.claimsPaid * pool.rewardPerClaim);
        if (remaining > 0) {
            paymentToken.safeTransfer(pool.creator, remaining);
            emit PoolCancelled(bountyId, pool.creator, remaining);
        }
    }
}
