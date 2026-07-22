// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract GigEscrow is ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    enum EscrowState {
        Created,
        Funded,
        InProgress,
        Completed,
        Disputed,
        Cancelled
    }

    enum MilestoneStatus {
        Pending,
        ReleaseRequested,
        Released,
        Disputed,
        Resolved
    }

    struct Milestone {
        uint256 amount;
        MilestoneStatus status;
        uint256 createdAt;
        uint256 releasedAt;
        uint256 disputedAt;
        uint256 resolvedAt;
    }

    address public admin;
    address public client;
    address public freelancer;
    IERC20 public paymentToken;
    uint256 public totalAmount;
    EscrowState public state;
    Milestone[] public milestones;
    uint256 public releasedCount;
    uint256 public activeDisputeCount;
    address public factory;

    // Platform fee config for this specific gig
    uint256 public platformFeeBps;
    address public feeRecipient;

    event EscrowFunded(address indexed client, uint256 amount, uint256 timestamp);
    event MilestoneReleaseRequested(uint256 indexed milestoneIndex, uint256 timestamp);
    event MilestoneReleased(uint256 indexed milestoneIndex, uint256 amount, uint256 timestamp);
    event MilestoneDisputed(uint256 indexed milestoneIndex, address indexed disputedBy, uint256 timestamp);
    event DisputeResolved(uint256 indexed milestoneIndex, address indexed winner, uint256 amount, uint256 timestamp);
    event DisputeResolvedProportional(uint256 indexed milestoneIndex, uint256 freelancerShareBps, uint256 freelancerAmount, uint256 clientAmount, uint256 timestamp);
    event EscrowRefunded(address indexed client, uint256 amount, uint256 timestamp);
    event StateChanged(EscrowState indexed oldState, EscrowState indexed newState, uint256 timestamp);
    event EscrowCompleted(uint256 timestamp);

    error Unauthorized();
    error InvalidState(EscrowState expected, EscrowState actual);
    error InvalidMilestoneIndex(uint256 index, uint256 total);
    error InvalidMilestoneStatus(MilestoneStatus expected, MilestoneStatus actual);
    error ZeroAddress();
    error ZeroAmount();
    error InvalidMilestoneCount();

    modifier onlyClient() {
        if (msg.sender != client) revert Unauthorized();
        _;
    }

    modifier onlyFreelancer() {
        if (msg.sender != freelancer) revert Unauthorized();
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyParties() {
        if (msg.sender != client && msg.sender != freelancer) revert Unauthorized();
        _;
    }

    modifier inState(EscrowState _expected) {
        if (state != _expected) revert InvalidState(_expected, state);
        _;
    }

    modifier validMilestone(uint256 _index) {
        if (_index >= milestones.length) revert InvalidMilestoneIndex(_index, milestones.length);
        _;
    }

    bool public initialized;

    constructor() {
        initialized = true; // prevent initialization of the logic contract
    }

    function initialize(
        address _admin,
        address _client,
        address _freelancer,
        address _token,
        uint256 _totalAmount,
        uint256 _milestoneCount,
        uint256 _platformFeeBps,
        address _feeRecipient
    ) external {
        require(!initialized, "Already initialized");
        initialized = true;
        if (_admin == address(0) || _client == address(0) || _freelancer == address(0) || _token == address(0) || _feeRecipient == address(0))
            revert ZeroAddress();
        if (_totalAmount == 0) revert ZeroAmount();
        if (_milestoneCount == 0 || _milestoneCount > 20) revert InvalidMilestoneCount();
        if (_platformFeeBps > 10000) revert Unauthorized();

        admin = _admin;
        client = _client;
        freelancer = _freelancer;
        paymentToken = IERC20(_token);
        totalAmount = _totalAmount;
        state = EscrowState.Created;
        factory = msg.sender;
        
        platformFeeBps = _platformFeeBps;
        feeRecipient = _feeRecipient;

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

    function fundEscrow() external onlyClient inState(EscrowState.Created) nonReentrant whenNotPaused {
        paymentToken.safeTransferFrom(client, address(this), totalAmount);
        _setState(EscrowState.Funded);
        emit EscrowFunded(client, totalAmount, block.timestamp);
    }

    function requestRelease(uint256 _index) external onlyFreelancer validMilestone(_index) whenNotPaused {
        if (state != EscrowState.Funded && state != EscrowState.InProgress) revert InvalidState(EscrowState.Funded, state);
        Milestone storage ms = milestones[_index];
        if (ms.status != MilestoneStatus.Pending) revert InvalidMilestoneStatus(MilestoneStatus.Pending, ms.status);

        ms.status = MilestoneStatus.ReleaseRequested;
        emit MilestoneReleaseRequested(_index, block.timestamp);
    }

    function releaseMilestone(uint256 _index) external onlyClient validMilestone(_index) nonReentrant whenNotPaused {
        if (state != EscrowState.Funded && state != EscrowState.InProgress) revert InvalidState(EscrowState.Funded, state);
        Milestone storage ms = milestones[_index];
        if (ms.status != MilestoneStatus.Pending && ms.status != MilestoneStatus.ReleaseRequested) revert InvalidMilestoneStatus(MilestoneStatus.Pending, ms.status);

        ms.status = MilestoneStatus.Released;
        ms.releasedAt = block.timestamp;
        releasedCount++;

        uint256 fee = (ms.amount * platformFeeBps) / 10000;
        uint256 freelancerAmount = ms.amount - fee;

        if (fee > 0) paymentToken.safeTransfer(feeRecipient, fee);
        paymentToken.safeTransfer(freelancer, freelancerAmount);

        if (state == EscrowState.Funded) _setState(EscrowState.InProgress);
        emit MilestoneReleased(_index, ms.amount, block.timestamp);

        if (releasedCount == milestones.length) {
            _setState(EscrowState.Completed);
            emit EscrowCompleted(block.timestamp);
        }
    }

    function disputeMilestone(uint256 _index) external onlyParties validMilestone(_index) whenNotPaused {
        if (state != EscrowState.Funded && state != EscrowState.InProgress) revert InvalidState(EscrowState.Funded, state);
        Milestone storage ms = milestones[_index];
        if (ms.status != MilestoneStatus.Pending && ms.status != MilestoneStatus.ReleaseRequested) revert InvalidMilestoneStatus(MilestoneStatus.Pending, ms.status);

        ms.status = MilestoneStatus.Disputed;
        ms.disputedAt = block.timestamp;
        activeDisputeCount++;

        _setState(EscrowState.Disputed);
        emit MilestoneDisputed(_index, msg.sender, block.timestamp);
    }

    /**
     * @notice Admin resolves a disputed milestone proportionally
     * @param _index Milestone index
     * @param freelancerShareBps Share of the milestone going to freelancer (0-10000)
     */
    function resolveDispute(uint256 _index, uint256 freelancerShareBps) external onlyAdmin validMilestone(_index) nonReentrant whenNotPaused {
        if (freelancerShareBps > 10000) revert Unauthorized();

        Milestone storage ms = milestones[_index];
        if (ms.status != MilestoneStatus.Disputed) revert InvalidMilestoneStatus(MilestoneStatus.Disputed, ms.status);

        ms.status = MilestoneStatus.Resolved;
        ms.resolvedAt = block.timestamp;
        activeDisputeCount--;

        uint256 total = ms.amount;
        uint256 toFreelancerTotal = (total * freelancerShareBps) / 10000;
        uint256 toClient = total - toFreelancerTotal;

        uint256 fee = (toFreelancerTotal * platformFeeBps) / 10000;
        uint256 toFreelancer = toFreelancerTotal - fee;

        if (fee > 0) paymentToken.safeTransfer(feeRecipient, fee);
        if (toFreelancer > 0) paymentToken.safeTransfer(freelancer, toFreelancer);
        if (toClient > 0) paymentToken.safeTransfer(client, toClient);

        if (toFreelancerTotal > 0) {
            releasedCount++;
        }

        emit DisputeResolvedProportional(_index, freelancerShareBps, toFreelancer, toClient, block.timestamp);

        if (_allMilestonesSettled()) {
            _setState(EscrowState.Completed);
            emit EscrowCompleted(block.timestamp);
        } else if (activeDisputeCount == 0) {
            _setState(EscrowState.InProgress);
        }
    }

    function refund() external nonReentrant whenNotPaused {
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
            paymentToken.safeTransfer(client, refundAmount);
        }

        _setState(EscrowState.Cancelled);
        emit EscrowRefunded(client, refundAmount, block.timestamp);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    function getMilestone(uint256 _index) external view validMilestone(_index) returns (Milestone memory) {
        return milestones[_index];
    }

    function getBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    function _setState(EscrowState _newState) private {
        EscrowState oldState = state;
        state = _newState;
        emit StateChanged(oldState, _newState, block.timestamp);
    }

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

contract EscrowFactory {
    address public admin;
    address public implementation;

    uint256 public platformFeeBps = 200; // Default 2%
    address public feeRecipient;

    address[] public escrows;
    mapping(address => address[]) public clientEscrows;
    mapping(address => address[]) public freelancerEscrows;

    event EscrowCreated(
        address indexed escrowAddress,
        address indexed client,
        address indexed freelancer,
        address token,
        uint256 totalAmount,
        uint256 milestoneCount,
        uint256 timestamp
    );
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    event FeeConfigUpdated(uint256 platformFeeBps, address indexed feeRecipient);

    error Unauthorized();
    error ZeroAddress();
    error ZeroAmount();
    error ClientIsFreelancer();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    constructor(address _admin, address _feeRecipient) {
        if (_admin == address(0) || _feeRecipient == address(0)) revert ZeroAddress();
        admin = _admin;
        feeRecipient = _feeRecipient;

        // Deploy the logic contract that will be cloned
        GigEscrow logic = new GigEscrow();
        implementation = address(logic);
    }

    function createEscrow(
        address _freelancer,
        address _token,
        uint256 _totalAmount,
        uint256 _milestoneCount
    ) external returns (address escrowAddress) {
        if (_freelancer == address(0) || _token == address(0)) revert ZeroAddress();
        if (_totalAmount == 0) revert ZeroAmount();
        if (msg.sender == _freelancer) revert ClientIsFreelancer();

        escrowAddress = Clones.clone(implementation);
        GigEscrow(escrowAddress).initialize(
            admin,
            msg.sender,
            _freelancer,
            _token,
            _totalAmount,
            _milestoneCount,
            platformFeeBps,
            feeRecipient
        );

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
    
    function setFeeConfig(uint256 _platformFeeBps, address _feeRecipient) external onlyAdmin {
        if (_platformFeeBps > 10000) revert Unauthorized();
        if (_feeRecipient == address(0)) revert ZeroAddress();
        platformFeeBps = _platformFeeBps;
        feeRecipient = _feeRecipient;
        emit FeeConfigUpdated(_platformFeeBps, _feeRecipient);
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        if (_newAdmin == address(0)) revert ZeroAddress();
        address oldAdmin = admin;
        admin = _newAdmin;
        emit AdminTransferred(oldAdmin, _newAdmin);
    }

    function getEscrowCount() external view returns (uint256) {
        return escrows.length;
    }

    function getClientEscrows(address _client) external view returns (address[] memory) {
        return clientEscrows[_client];
    }

    function getFreelancerEscrows(address _freelancer) external view returns (address[] memory) {
        return freelancerEscrows[_freelancer];
    }
}
