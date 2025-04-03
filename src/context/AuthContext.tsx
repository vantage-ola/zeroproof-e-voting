"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { ethers } from "ethers"
import { api } from "../services/api"

interface AuthContextType {
  address: string | null
  isAdmin: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  signMessage: (message: any) => Promise<any>
}

const AuthContext = createContext<AuthContextType>({
  address: null,
  isAdmin: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  signMessage: async () => ({}),
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const ADMIN_ADDRESS = "0x1a67b91acE32823a75da86104E8931cc94f2C9D8"

  useEffect(() => {
    // Check if user was previously connected
    const checkConnection = async () => {
      if (window.ethereum && window.ethereum.isMetaMask) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            setAddress(accounts[0])
            setIsAdmin(accounts[0].toLowerCase() === ADMIN_ADDRESS.toLowerCase())
          }
        } catch (error) {
          console.error("Error checking connection:", error)
        }
      }
    }

    checkConnection()

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsAdmin(accounts[0].toLowerCase() === ADMIN_ADDRESS.toLowerCase())
        } else {
          setAddress(null)
          setIsAdmin(false)
        }
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
      }
    }
  }, [])

  const connect = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this application")
      return
    }

    setIsConnecting(true)

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      setAddress(accounts[0])
      setIsAdmin(accounts[0].toLowerCase() === ADMIN_ADDRESS.toLowerCase())
    } catch (error) {
      console.error("Error connecting to MetaMask:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsAdmin(false)
  }

  const signMessage = async (message: any) => {
    if (!address) throw new Error("Not connected")

    try {
      const nonce = await api.getNonce(address)
      // Encode message and nonce according to backend format
      const base64message = ethers.encodeBase64(ethers.toUtf8Bytes(JSON.stringify(message)))
      const base64nonce = ethers.encodeBase64(ethers.toUtf8Bytes(nonce.toString()))
      const content = base64nonce + "." + base64message

      // Request signature from MetaMask
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [content, address],
      })
      //const wallet = new ethers.Wallet("0xa9c5f5773bd2349ff47b84754cd178605ed57dce10a3d5f6b854748501d06a8b");
      //const signature = wallet.signMessageSync(content);


      // Return the payload
      return {
        content,
        signature,
        address,
      }
    } catch (error) {
      console.error("Error signing message:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        address,
        isAdmin,
        isConnecting,
        connect,
        disconnect,
        signMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

