"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./abi/Counter.json";

const contractAddress = "0x1615E00CbF4031Ad549f73792aE4fF0b10682B76";
const AMOY_PARAMS = {
  chainId: "0x13882",
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
};

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [value, setValue] = useState<string>("");

  const getValue = async (ctr: ethers.Contract) => {
    try {
      const val = await ctr.x();
      setValue(val.toString());
    } catch (err) {
      console.error("Failed to read value:", err);
    }
  };

  const setupWithMetaMask = async () => {
    const eth = (window as any).ethereum;
    if (!eth) throw new Error("MetaMask not installed");

    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_PARAMS.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [AMOY_PARAMS],
        });
      } else {
        throw switchError;
      }
    }

    const provider = new ethers.BrowserProvider(eth);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    const addr = await signer.getAddress();
    setAccount(addr);

    const ctr = new ethers.Contract(contractAddress, abi, signer);
    setContract(ctr);

    await getValue(ctr);
  };

  const setupReadOnly = async () => {
    const provider = new ethers.JsonRpcProvider(AMOY_PARAMS.rpcUrls[0]);
    const ctr = new ethers.Contract(contractAddress, abi, provider);
    setContract(ctr);

    await getValue(ctr);
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          await setupWithMetaMask();
        } else {
          console.log("No MetaMask detected → falling back to read-only mode");
          await setupReadOnly();
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      }
    };

    init();
  }, []);


  const handleIncrement = async () => {
    if (!contract) return;
    try {
      const tx = await contract.inc();
      await tx.wait();
      await getValue(contract);
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold">Counter</h1>
      <p>Account: {account}</p>
      <p>Value: {value}</p>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleIncrement}>increase</button>
    </div>
  );
}
