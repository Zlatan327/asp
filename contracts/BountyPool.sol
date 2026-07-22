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
    
    uint256 public platformFeeBps = 200; // Default 2%
    address public feeRecipient;

    struct Pool {
        address creator;
        uint256 totalAmount;
        uint256 rewardPerClaim;
        uint256 claimsPaid;
        bool isActive;
    }

    // Mapping from bountyId (bytes32) to Pool
    mapping(bytes32 => Pool) public pools;
    // Mapping from bountyId -> (userAddress => bool) to prevent double claims
    mapping(bytes32 => mapping(address => bool)) public hasClaimed;

    event PoolCreated(bytes32 indexed bountyId, address indexed creator, uint256 totalAmount, uint256 rewardPerClaim);
    event BountyClaimed(bytes32 indexed bountyId, address indexed user, uint256 amount);
    event PoolCancelled(bytes32 indexed bountyId, address indexed creator, uint256 refundAmount);
    event VerifierUpdated(address indexed newVerifier);
    event FeeConfigUpdated(uint256 platformFeeBps, address indexed feeRecipient);

    constructor(address _paymentToken, address _backendVerifier, address _feeRecipient) Ownable(msg.sender) {
        require(_paymentToken != address(0), "Invalid token");
        require(_backendVerifier != address(0), "Invalid verifier");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        paymentToken = IERC20(_paymentToken);
        backendVerifier = _backendVerifier;
        feeRecipient = _feeRecipient;
    }

    function setBackendVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Invalid verifier");
        backendVerifier = _newVerifier;
        emit VerifierUpdated(_newVerifier);
    }
    
    function setFeeConfig(uint256 _platformFeeBps, address _feeRecipient) external onlyOwner {
        require(_platformFeeBps <= 10000, "Fee too high");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        platformFeeBps = _platformFeeBps;
        feeRecipient = _feeRecipient;
        emit FeeConfigUpdated(_platformFeeBps, _feeRecipient);
    }

    function createPool(bytes32 bountyId, uint256 totalAmount, uint256 rewardPerClaim) external whenNotPaused {
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
    function distributeReward(bytes32 bountyId, address user) external {
        require(msg.sender == backendVerifier || msg.sender == owner(), "Only verifier can distribute");
        Pool storage pool = pools[bountyId];
        require(pool.isActive, "Pool is not active");
        require(!hasClaimed[bountyId][user], "User already claimed");
        require(pool.totalAmount - (pool.claimsPaid * pool.rewardPerClaim) >= pool.rewardPerClaim, "Pool depleted");

        hasClaimed[bountyId][user] = true;
        pool.claimsPaid++;

        uint256 fee = (pool.rewardPerClaim * platformFeeBps) / 10000;
        uint256 userAmount = pool.rewardPerClaim - fee;

        if (fee > 0) {
            paymentToken.safeTransfer(feeRecipient, fee);
        }
        paymentToken.safeTransfer(user, userAmount);
        
        emit BountyClaimed(bountyId, user, userAmount);
    }

    function cancelPool(bytes32 bountyId) external nonReentrant {
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
