// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationSBT
 * @author ASP Platform
 * @notice Soulbound Token (non-transferable ERC-721) that represents a user's
 *         on-chain reputation on the ASP freelancer platform.
 * @dev Each address can hold at most one SBT. Transfers between non-zero
 *      addresses are blocked by overriding `_update`. Only the platform
 *      (contract owner) can mint and update token metadata.
 *
 *      Token URI should point to a JSON metadata file containing reputation
 *      scores, completed gigs, dispute history, etc.
 */
contract ReputationSBT is ERC721, ERC721URIStorage, Ownable {
    // ──────────────────────────────────────────────
    //  State variables
    // ──────────────────────────────────────────────

    /// @notice Auto-incrementing token ID counter.
    uint256 private _nextTokenId;

    /// @notice Maps a user address to their SBT token ID.
    mapping(address => uint256) private _userTokenId;

    /// @notice Tracks whether an address already holds an SBT.
    mapping(address => bool) private _hasToken;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    /// @notice Emitted when a new reputation SBT is minted.
    event ReputationMinted(address indexed user, uint256 indexed tokenId, string uri, uint256 timestamp);

    /// @notice Emitted when a reputation SBT's metadata is updated.
    event ReputationUpdated(uint256 indexed tokenId, string newUri, uint256 timestamp);

    // ──────────────────────────────────────────────
    //  Errors
    // ──────────────────────────────────────────────

    /// @dev User already holds an SBT.
    error AlreadyHasReputation(address user);

    /// @dev User does not hold an SBT.
    error NoReputation(address user);

    /// @dev Soulbound tokens cannot be transferred.
    error SoulboundTransferNotAllowed();

    /// @dev Cannot mint to zero address.
    error ZeroAddress();

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    /**
     * @param _platformOwner Address of the platform that controls minting.
     */
    constructor(address _platformOwner)
        ERC721("ASP Reputation", "ASPR")
        Ownable(_platformOwner)
    {
        // Token IDs start at 1
        _nextTokenId = 1;
    }

    // ──────────────────────────────────────────────
    //  Core functions
    // ──────────────────────────────────────────────

    /**
     * @notice Mints a new reputation SBT to `_user`.
     * @param _user     Address to receive the SBT.
     * @param _tokenURI URI pointing to the reputation metadata JSON.
     * @return tokenId  The newly minted token ID.
     * @dev Only callable by the platform owner. Each address can only hold one SBT.
     */
    function mint(address _user, string calldata _tokenURI)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        if (_user == address(0)) revert ZeroAddress();
        if (_hasToken[_user]) revert AlreadyHasReputation(_user);

        tokenId = _nextTokenId++;

        _safeMint(_user, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        _userTokenId[_user] = tokenId;
        _hasToken[_user] = true;

        emit ReputationMinted(_user, tokenId, _tokenURI, block.timestamp);
    }

    /**
     * @notice Updates the metadata URI of an existing reputation SBT.
     * @param _tokenId Token ID to update.
     * @param _newURI  New metadata URI.
     * @dev Only callable by the platform owner. Used to reflect updated
     *      reputation scores after gig completions or disputes.
     */
    function updateReputation(uint256 _tokenId, string calldata _newURI)
        external
        onlyOwner
    {
        // Ensure token exists by checking owner (reverts if not minted)
        address owner = ownerOf(_tokenId);
        if (owner == address(0)) revert ZeroAddress();

        _setTokenURI(_tokenId, _newURI);
        emit ReputationUpdated(_tokenId, _newURI, block.timestamp);
    }

    // ──────────────────────────────────────────────
    //  View functions
    // ──────────────────────────────────────────────

    /**
     * @notice Returns the token ID of the SBT held by `_user`.
     * @param _user Address to query.
     * @return tokenId The user's SBT token ID.
     * @dev Reverts if the user does not have an SBT.
     */
    function getReputation(address _user) external view returns (uint256 tokenId) {
        if (!_hasToken[_user]) revert NoReputation(_user);
        return _userTokenId[_user];
    }

    /**
     * @notice Checks whether `_user` holds an SBT.
     * @param _user Address to check.
     * @return True if the user has a reputation SBT.
     */
    function hasReputation(address _user) external view returns (bool) {
        return _hasToken[_user];
    }

    // ──────────────────────────────────────────────
    //  Overrides — Soulbound enforcement
    // ──────────────────────────────────────────────

    /**
     * @dev Overrides ERC721's internal `_update` to prevent transfers between
     *      non-zero addresses (soulbound). Only minting (from == 0) and burning
     *      (to == 0) are allowed.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block all other transfers
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferNotAllowed();
        }

        return super._update(to, tokenId, auth);
    }

    // ──────────────────────────────────────────────
    //  Required overrides (ERC721 + ERC721URIStorage)
    // ──────────────────────────────────────────────

    /// @inheritdoc ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /// @inheritdoc ERC721URIStorage
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
