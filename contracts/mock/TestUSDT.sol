// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDT
 * @dev Mock ERC20 token for testing the Gig Escrow flow on X Layer Testnet.
 * Anyone can mint tokens for testing purposes.
 */
contract TestUSDT is ERC20, Ownable {
    constructor() ERC20("Tether USD", "USDT") Ownable(msg.sender) {}

    /**
     * @dev Mint tokens to the specified address. Useful for testing escrows.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint (remember decimals: 10^18 or 10^6).
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
