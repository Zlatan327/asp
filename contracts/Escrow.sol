// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IERC20.sol";

/**
 * @title GigEscrow
 * @author ASP Platform
 * @notice Per-gig escrow contract that holds ERC-20 tokens (USDT/USDC) and releases
 *         them in milestone-based instalments. Supports dispute resolution by a
 *         platform-appointed admin.
 * @dev Deployed by EscrowFactory — one instance per gig. Uses OpenZeppelin's
 *      ReentrancyGuard to prevent reentrancy on all token-transfer paths and
 *      Pausable so the platform can freeze operations in an emergency.
 */
contract GigEscrow is ReentrancyGuard, Pausable {
    // ──────────────────────────────────────────────
    //  Enums
    // ──────────────────────────────────────────────

    /// @notice Lifecycle states of the escrow contract.
    enum EscrowState {
        Created,     // 0 — escrow deployed, awaiting funding
        Funded,      // 1 — client has deposited tokens
        InProgress,  // 2 — at least one milestone released
        Completed,   // 3 — all milestones released
        Disputed,    // 4 — one or more milestones are disputed
        Cancelled    // 5 — gig cancelled, funds refunded
    }

    /// @notice Status of an individual milestone.
    enum MilestoneStatus {
        Pending,           // 0 — awaiting work
        ReleaseRequested,  // 1 — freelancer requested release
        Released,          // 2 — client released payment
        Disputed,          // 3 — dispute opened
        Resolved           // 4 — dispute resolved by admin
    }

    // ──────────────────────────────────────────────
    //  Structs
    // ──────────────────────────────────────────────

    /// @notice Represents a single milestone within the gig.
    struct Milestone {
        uint256 amount;               // payment amount for this milestone
        MilestoneStatus status;       // current status
        uint256 createdAt;            // timestamp when the milestone was created
        uint256 releasedAt;           // timestamp when funds were released
        uint256 disputedAt;           // timestamp when dispute was opened
        uint256 resolvedAt;           // timestamp when dispute was resolved
    }

    // ──────────────────────────────────────────────
    //  State variables
    // ──────────────────────────────────────────────

    /// @notice Address of the platform admin who can resolve disputes.
    address public admin;

    /// @notice Address of the client who created and funds the escrow.
    address public client;

    /// @notice Address of the freelancer who receives milestone payments.
    address public freelancer;

    /// @notice ERC-20 token used for payment (e.g., USDT on X Layer).
    IERC20 public paymentToken;

    /// @notice Total amount of tokens to be held in escrow.
    uint256 public totalAmount;

    /// @notice Current state of the escrow.
    EscrowState public state;

    /// @notice Array of milestones for this gig.
    Milestone[] public milestones;

    /// @notice Number of milestones that have been released (or resolved in favour of freelancer).
    uint256 public releasedCount;

    /// @notice Number of milestones currently in dispute.
    uint256 public activeDisputeCount;

    /// @notice Address of the factory that deployed this escrow.
    address public factory;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    /// @notice Emitted when the escrow is funded by the client.
    event EscrowFunded(address indexed client, uint256 amount, uint256 timestamp);

    /// @notice Emitted when a freelancer requests milestone release.
    event MilestoneReleaseRequested(uint256 indexed milestoneIndex, uint256 timestamp);

    /// @notice Emitted when a milestone payment is released to the freelancer.
    event MilestoneReleased(uint256 indexed milestoneIndex, uint256 amount, uint256 timestamp);

    /// @notice Emitted when a milestone is disputed.
    event MilestoneDisputed(uint256 indexed milestoneIndex, address indexed disputedBy, uint256 timestamp);

    /// @notice Emitted when a dispute is resolved by the admin.
    event DisputeResolved(uint256 indexed milestoneIndex, address indexed winner, uint256 amount, uint256 timestamp);

    /// @notice Emitted when the escrow is refunded to the client.
    event EscrowRefunded(address indexed client, uint256 amount, uint256 timestamp);

    /// @notice Emitted when the escrow state changes.
    event StateChanged(EscrowState indexed oldState, EscrowState indexed newState, uint256 timestamp);

    /// @notice Emitted when the escrow is fully completed.
    event EscrowCompleted(uint256 timestamp);

    // ──────────────────────────────────────────────
    //  Errors
    // ──────────────────────────────────────────────

    error Unauthorized();
    error InvalidState(EscrowState expected, EscrowState actual);
    error InvalidMilestoneIndex(uint256 index, uint256 total);
    error InvalidMilestoneStatus(MilestoneStatus expected, MilestoneStatus actual);
    error TransferFailed();
    error ZeroAddress();
    error ZeroAmount();
    error InvalidMilestoneCount();

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    /// @dev Restricts to the client address.
    modifier onlyClient() {
        if (msg.sender != client) revert Unauthorized();
        _;
    }

    /// @dev Restricts to the freelancer address.
    modifier onlyFreelancer() {
        if (msg.sender != freelancer) revert Unauthorized();
        _;
    }

    /// @dev Restricts to the platform admin.
    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    /// @dev Restricts to client or freelancer.
    modifier onlyParties() {
        if (msg.sender != client && msg.sender != freelancer) revert Unauthorized();
        _;
    }

    /// @dev Requires the escrow to be in the given state.
    modifier inState(EscrowState _expected) {
        if (state != _expected) revert InvalidState(_expected, state);
        _;
    }

    /// @dev Validates milestone index.
    modifier validMilestone(uint256 _index) {
        if (_index >= milestones.length) revert InvalidMilestoneIndex(_index, milestones.length);
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    /**
     * @notice Initialises a new GigEscrow.
     * @param _admin       Platform admin address (resolves disputes).
     * @param _client      Client who funds the escrow.
     * @param _freelancer  Freelancer who receives milestone payments.
     * @param _token       ERC-20 token address used for payment.
     * @param _totalAmount Total token amount to be escrowed.
     * @param _milestoneCount Number of equal milestones.
     */
    constructor(
        address _admin,
        address _client,
        address _freelancer,
        address _token,
        uint256 _totalAmount,
        uint256 _milestoneCount
    ) {
        if (_admin == address(0) || _client == address(0) || _freelancer == address(0) || _token == address(0))
            revert ZeroAddress();
        if (_totalAmount == 0) revert ZeroAmount();
        if (_milestoneCount == 0 || _milestoneCount > 20) revert InvalidMilestoneCount();

        admin = _admin;
        client = _client;
        freelancer = _freelancer;
        paymentToken = IERC20(_token);
        totalAmount = _totalAmount;
        state = EscrowState.Created;
        factory = msg.sender;

        // Create milestones with equal distribution; remainder goes to the last milestone.
        uint256 perMilestone = _totalAmount / _milestoneCount;
        uint256 remainder = _totalAmount - (perMilestone * _milestoneCount);

        for (uint256 i = 0; i < _milestoneCount; i++) {
            uint256 amount = perMilestone;
            if (i == _milestoneCount - 1) {
                amount += remainder;
            }
            milestones.push(
                Milestone({
                    amount: amount,
                    status: MilestoneStatus.Pending,
                    createdAt: block.timestamp,
                    releasedAt: 0,
                    disputedAt: 0,
                    resolvedAt: 0
                })
            );
        }
    }

    // ──────────────────────────────────────────────
    //  Core functions
    // ──────────────────────────────────────────────

    /**
     * @notice Client deposits the full escrow amount in ERC-20 tokens.
     * @dev Caller must have approved this contract for at least `totalAmount`.
     *      Uses `transferFrom` to pull tokens from the client.
     */
    function fundEscrow()
        external
        onlyClient
        inState(EscrowState.Created)
        nonReentrant
        whenNotPaused
    {
        bool success = paymentToken.transferFrom(client, address(this), totalAmount);
        if (!success) revert TransferFailed();

        _setState(EscrowState.Funded);
        emit EscrowFunded(client, totalAmount, block.timestamp);
    }

    /**
     * @notice Freelancer requests the release of a specific milestone.
     * @param _index Milestone index (0-based).
     */
    function requestRelease(uint256 _index)
        external
        onlyFreelancer
        validMilestone(_index)
        whenNotPaused
    {
        // Allow request when escrow is Funded or InProgress
        if (state != EscrowState.Funded && state != EscrowState.InProgress)
            revert InvalidState(EscrowState.Funded, state);

        Milestone storage ms = milestones[_index];
        if (ms.status != MilestoneStatus.Pending)
            revert InvalidMilestoneStatus(MilestoneStatus.Pending, ms.status);

        ms.status = MilestoneStatus.ReleaseRequested;
        emit MilestoneReleaseRequested(_index, block.timestamp);
    }

    /**
     * @notice Client releases payment for a milestone to the freelancer.
     * @param _index Milestone index (0-based).
     * @dev Milestone must be Pending or ReleaseRequested.
     */
    function releaseMilestone(uint256 _index)
        external
        onlyClient
        validMilestone(_index)
        nonReentrant
        whenNotPaused
    {
        // Allow release when escrow is Funded or InProgress
        if (state != EscrowState.Funded && state != EscrowState.InProgress)
            revert InvalidState(EscrowState.Funded, state);

        Milestone storage ms = milestones[_index];
        if (ms.status != MilestoneStatus.Pending && ms.status != MilestoneStatus.ReleaseRequested)
            revert InvalidMilestoneStatus(MilestoneStatus.Pending, ms.status);

        ms.status = MilestoneStatus.Released;
        ms.releasedAt = block.timestamp;
        releasedCount++;

        // Transfer tokens to freelancer
        bool success = paymentToken.transfer(freelancer, ms.amount);
        if (!success) revert TransferFailed();

        // Update global state
        if (state == EscrowState.Funded) {
            _setState(EscrowState.InProgress);
        }

        emit MilestoneReleased(_index, ms.amount, block.timestamp);

        // Check if all milestones are complete
        if (releasedCount == milestones.length) {
            _setState(EscrowState.Completed);
            emit EscrowCompleted(block.timestamp);
        }
    }

    /**
     * @notice Either client or freelancer disputes a milestone.
     * @param _index Milestone index (0-based).
     */
    function disputeMilestone(uint256 _index)
        external
        onlyParties
        validMilestone(_index)
        whenNotPaused
    {
        if (state != EscrowState.Funded && state != EscrowState.InProgress)
            revert InvalidState(EscrowState.Funded, state);

        Milestone storage ms = milestones[_index];
        if (ms.status != MilestoneStatus.Pending && ms.status != MilestoneStatus.ReleaseRequested)
            revert InvalidMilestoneStatus(MilestoneStatus.Pending, ms.status);

        ms.status = MilestoneStatus.Disputed;
        ms.disputedAt = block.timestamp;
        activeDisputeCount++;

        _setState(EscrowState.Disputed);
        emit MilestoneDisputed(_index, msg.sender, block.timestamp);
    }

    /**
     * @notice Admin resolves a disputed milestone in favour of the winner.
     * @param _index  Milestone index (0-based).
     * @param _winner Address of the winning party (client or freelancer).
     * @dev If winner is freelancer, funds are released to them.
     *      If winner is client, funds are returned to the client.
     */
    function resolveDispute(uint256 _index, address _winner)
        external
        onlyAdmin
        validMilestone(_index)
        nonReentrant
        whenNotPaused
    {
        if (_winner != client && _winner != freelancer) revert Unauthorized();

        Milestone storage ms = milestones[_index];
        if (ms.status != MilestoneStatus.Disputed)
            revert InvalidMilestoneStatus(MilestoneStatus.Disputed, ms.status);

        ms.status = MilestoneStatus.Resolved;
        ms.resolvedAt = block.timestamp;
        activeDisputeCount--;

        // Transfer to the winner
        bool success = paymentToken.transfer(_winner, ms.amount);
        if (!success) revert TransferFailed();

        // If winner is freelancer, count as released
        if (_winner == freelancer) {
            releasedCount++;
        }

        emit DisputeResolved(_index, _winner, ms.amount, block.timestamp);

        // Re-evaluate overall state
        if (_allMilestonesSettled()) {
            _setState(EscrowState.Completed);
            emit EscrowCompleted(block.timestamp);
        } else if (activeDisputeCount == 0) {
            // No more active disputes — go back to InProgress
            _setState(EscrowState.InProgress);
        }
    }

    /**
     * @notice Refund the remaining escrow balance to the client and cancel the gig.
     * @dev Only callable by client when no milestones have been released, or by admin.
     *      Refunds only unreleased/unresolved milestone amounts.
     */
    function refund()
        external
        nonReentrant
        whenNotPaused
    {
        // Only client (if no milestones released) or admin can refund
        if (msg.sender == client) {
            if (state != EscrowState.Funded) revert InvalidState(EscrowState.Funded, state);
        } else if (msg.sender == admin) {
            if (state == EscrowState.Completed || state == EscrowState.Cancelled || state == EscrowState.Created)
                revert InvalidState(EscrowState.Funded, state);
        } else {
            revert Unauthorized();
        }

        uint256 refundAmount = 0;
        for (uint256 i = 0; i < milestones.length; i++) {
            Milestone storage ms = milestones[i];
            if (ms.status == MilestoneStatus.Pending || ms.status == MilestoneStatus.ReleaseRequested) {
                refundAmount += ms.amount;
                ms.status = MilestoneStatus.Resolved;
                ms.resolvedAt = block.timestamp;
            } else if (ms.status == MilestoneStatus.Disputed) {
                refundAmount += ms.amount;
                ms.status = MilestoneStatus.Resolved;
                ms.resolvedAt = block.timestamp;
                activeDisputeCount--;
            }
        }

        if (refundAmount > 0) {
            bool success = paymentToken.transfer(client, refundAmount);
            if (!success) revert TransferFailed();
        }

        _setState(EscrowState.Cancelled);
        emit EscrowRefunded(client, refundAmount, block.timestamp);
    }

    // ──────────────────────────────────────────────
    //  Admin functions
    // ──────────────────────────────────────────────

    /// @notice Pause all escrow operations (emergency).
    function pause() external onlyAdmin {
        _pause();
    }

    /// @notice Unpause escrow operations.
    function unpause() external onlyAdmin {
        _unpause();
    }

    // ──────────────────────────────────────────────
    //  View functions
    // ──────────────────────────────────────────────

    /// @notice Returns the total number of milestones.
    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    /// @notice Returns full details of a milestone.
    function getMilestone(uint256 _index)
        external
        view
        validMilestone(_index)
        returns (Milestone memory)
    {
        return milestones[_index];
    }

    /// @notice Returns the token balance held by this contract.
    function getBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    // ──────────────────────────────────────────────
    //  Internal helpers
    // ──────────────────────────────────────────────

    /// @dev Transitions state and emits a StateChanged event.
    function _setState(EscrowState _newState) private {
        EscrowState oldState = state;
        state = _newState;
        emit StateChanged(oldState, _newState, block.timestamp);
    }

    /// @dev Returns true if every milestone is Released or Resolved.
    function _allMilestonesSettled() private view returns (bool) {
        for (uint256 i = 0; i < milestones.length; i++) {
            MilestoneStatus s = milestones[i].status;
            if (s != MilestoneStatus.Released && s != MilestoneStatus.Resolved) {
                return false;
            }
        }
        return true;
    }
}

/**
 * @title EscrowFactory
 * @author ASP Platform
 * @notice Factory contract that deploys individual GigEscrow instances for each gig.
 * @dev Maintains a registry of all deployed escrows, indexed by client and freelancer.
 */
contract EscrowFactory {
    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    /// @notice Platform admin address passed to each GigEscrow.
    address public admin;

    /// @notice List of all deployed escrow contracts.
    address[] public escrows;

    /// @notice Mapping from client address to their escrow contracts.
    mapping(address => address[]) public clientEscrows;

    /// @notice Mapping from freelancer address to their escrow contracts.
    mapping(address => address[]) public freelancerEscrows;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    /// @notice Emitted when a new GigEscrow is created.
    event EscrowCreated(
        address indexed escrowAddress,
        address indexed client,
        address indexed freelancer,
        address token,
        uint256 totalAmount,
        uint256 milestoneCount,
        uint256 timestamp
    );

    /// @notice Emitted when the admin role is transferred.
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    // ──────────────────────────────────────────────
    //  Errors
    // ──────────────────────────────────────────────

    error Unauthorized();
    error ZeroAddress();
    error ZeroAmount();
    error ClientIsFreelancer();

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    /// @param _admin Platform admin address.
    constructor(address _admin) {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    // ──────────────────────────────────────────────
    //  Core functions
    // ──────────────────────────────────────────────

    /**
     * @notice Deploys a new GigEscrow contract for a gig.
     * @param _freelancer    Address of the freelancer.
     * @param _token         ERC-20 token address for payment.
     * @param _totalAmount   Total payment amount in token units.
     * @param _milestoneCount Number of milestones (1–20).
     * @return escrowAddress Address of the newly deployed GigEscrow.
     */
    function createEscrow(
        address _freelancer,
        address _token,
        uint256 _totalAmount,
        uint256 _milestoneCount
    ) external returns (address escrowAddress) {
        if (_freelancer == address(0) || _token == address(0)) revert ZeroAddress();
        if (_totalAmount == 0) revert ZeroAmount();
        if (msg.sender == _freelancer) revert ClientIsFreelancer();

        GigEscrow escrow = new GigEscrow(
            admin,
            msg.sender,       // client = caller
            _freelancer,
            _token,
            _totalAmount,
            _milestoneCount
        );

        escrowAddress = address(escrow);
        escrows.push(escrowAddress);
        clientEscrows[msg.sender].push(escrowAddress);
        freelancerEscrows[_freelancer].push(escrowAddress);

        emit EscrowCreated(
            escrowAddress,
            msg.sender,
            _freelancer,
            _token,
            _totalAmount,
            _milestoneCount,
            block.timestamp
        );
    }

    // ──────────────────────────────────────────────
    //  Admin functions
    // ──────────────────────────────────────────────

    /**
     * @notice Transfer admin role to a new address.
     * @param _newAdmin New admin address.
     * @dev Only affects future escrows. Existing escrows retain original admin.
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        if (_newAdmin == address(0)) revert ZeroAddress();
        address oldAdmin = admin;
        admin = _newAdmin;
        emit AdminTransferred(oldAdmin, _newAdmin);
    }

    // ──────────────────────────────────────────────
    //  View functions
    // ──────────────────────────────────────────────

    /// @notice Returns the total number of escrows deployed.
    function getEscrowCount() external view returns (uint256) {
        return escrows.length;
    }

    /// @notice Returns all escrows for a given client.
    function getClientEscrows(address _client) external view returns (address[] memory) {
        return clientEscrows[_client];
    }

    /// @notice Returns all escrows for a given freelancer.
    function getFreelancerEscrows(address _freelancer) external view returns (address[] memory) {
        return freelancerEscrows[_freelancer];
    }
}
