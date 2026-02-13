// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Script.sol";
import "../src/PrivateShop.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = 0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8;
        
        vm.startBroadcast(deployerPrivateKey);

        PrivateShop shop = new PrivateShop(usdcAddress);
        
        console.log("Deployed PrivateShop to:", address(shop));

        vm.stopBroadcast();
    }
}
