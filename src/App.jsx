import { useState } from 'react';
import { BrowserProvider } from "ethers";
import './App.css';

function App() {

  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [loginToken, setLoginToken] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getLoginMessage = (timestamp) => {
    return `Signature for login authentication: ${timestamp}`;
  };

  const handleAuth = async (address, signature, timestamp) => {
    try {
      const response = await fetch(
        "https://api.polygon.dassets.xyz/auth/user/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: address,
            loginToken: timestamp,
            signature: signature,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      const jwt = data.data.accessToken;

      if (!jwt) {
        throw new Error("JWT not found in the response");
      }

      // Store token in localStorage under "accessToken"
      localStorage.setItem("accessToken", jwt);
      setIsAuthenticated(true);

      return data;
    } catch (err) {
      console.error("Authentication error:", err);
      throw new Error(err.message || "Authentication failed");
    }
  };

  const connectAndSign = async () => {
    setIsConnecting(true);
    setError("");
    setSignature("");
    setLoginToken("");

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed!");
      }

      // Create provider and request accounts
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      // Get signer and address
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      // Create unix timestamp for login token
      const timestamp = Date.now();
      setLoginToken(timestamp.toString());

      // Sign message with timestamp
      const message = getLoginMessage(timestamp);
      const signedMessage = await signer.signMessage(message);
      setSignature(signedMessage);

      // Authenticate with the server
      await handleAuth(address, signedMessage, timestamp);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleButtonClick = async () => {
    await connectAndSign();
  };

  const JWT = localStorage.getItem("accessToken")

  return (
    <div className="App">
      <button onClick={handleButtonClick} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Login"}
      </button>

      {walletAddress && (
        <div>
          <h1>User ID: <br /> {walletAddress}</h1>
          <h1>Login Token: <br /> {loginToken}</h1>
          <h1>Signature: <br />{signature}</h1>
        </div>
      )}

      <h1>jwt: <br />{JWT} </h1>

      {/* Display error message if there is an error */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default App;
