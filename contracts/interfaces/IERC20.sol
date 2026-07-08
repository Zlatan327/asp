// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC20
 * @notice Standard ERC-20 token interface as defined in EIP-20.
 * @dev Used by the Escrow contracts to interact with USDT/USDC on X Layer.
 */
interface IERC20 {
    /// @notice Emitted when `value` tokens are moved from `from` to `to`.
    event Transfer(address indexed from, address indexed to, uint256 value);

    /// @notice Emitted when `owner` sets `spender` allowance to `value`.
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /// @notice Returns the total supply of the token.
    function totalSupply() external view returns (uint256);

    /// @notice Returns the balance of `account`.
    function balanceOf(address account) external view returns (uint256);

    /// @notice Transfers `amount` tokens to `to`. Returns true on success.
    function transfer(address to, uint256 amount) external returns (bool);

    /// @notice Returns the remaining allowance `spender` can spend on behalf of `owner`.
    function allowance(address owner, address spender) external view returns (uint256);

    /// @notice Sets `spender` allowance to `amount`. Returns true on success.
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @notice Transfers `amount` tokens from `from` to `to` using allowance.
     * @dev Caller must have sufficient allowance from `from`.
     * @return True on success.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
