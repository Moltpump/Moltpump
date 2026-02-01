import { FC, useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const WalletConnection: FC = () => {
  const { publicKey, disconnect, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch SOL balance
  useEffect(() => {
    if (publicKey && connection) {
      const fetchBalance = async () => {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error("[Solana RPC] Failed to fetch balance", {
            endpoint: (connection as unknown as { rpcEndpoint?: string }).rpcEndpoint,
            error,
          });
        }
      };
      fetchBalance();

      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [publicKey, connection]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      toast.success("Address copied to clipboard");
    }
  };

  const openExplorer = () => {
    if (publicKey) {
      window.open(
        `https://solscan.io/account/${publicKey.toBase58()}`,
        "_blank"
      );
    }
  };

  if (!connected) {
    return (
      <Button
        onClick={() => setVisible(true)}
        className="gap-2 bg-primary hover:bg-primary/90"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-sm">
              {publicKey ? truncateAddress(publicKey.toBase58()) : ""}
            </span>
            {balance !== null && (
              <span className="text-muted-foreground">
                ({balance.toFixed(2)} SOL)
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyAddress} className="gap-2 cursor-pointer">
          <Copy className="h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openExplorer} className="gap-2 cursor-pointer">
          <ExternalLink className="h-4 w-4" />
          View on Solscan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
