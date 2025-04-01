"use client"

import type React from "react"

import {
  Box,
  Flex,
  Text,
  Button,
  HStack,
  IconButton,
  useDisclosure,
  Stack,
  Collapse,
  Link as ChakraLink,
} from "@chakra-ui/react"
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons"
import { Link as RouterLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const NavLink = ({ children, to }: { children: React.ReactNode; to: string }) => (
  <ChakraLink
    as={RouterLink}
    px={2}
    py={1}
    rounded={"md"}
    _hover={{
      textDecoration: "none",
      bg: "gray.200",
    }}
    to={to}
  >
    {children}
  </ChakraLink>
)

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure()
  const { address, isAdmin, connect, disconnect, isConnecting } = useAuth()

  return (
    <Box bg="white" px={4} boxShadow="sm">
      <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
        <IconButton
          size={"md"}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={"Toggle Navigation"}
          display={{ md: "none" }}
          onClick={onToggle}
        />
        <HStack spacing={8} alignItems={"center"}>
          <Box fontWeight="bold" fontSize="xl">
            <RouterLink to="/">zkVoting</RouterLink>
          </Box>
          <HStack as={"nav"} spacing={4} display={{ base: "none", md: "flex" }}>
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/groups">Groups</NavLink>
            <NavLink to="/votings">Votings</NavLink>
          </HStack>
        </HStack>
        <Flex alignItems={"center"}>
          {address ? (
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                {isAdmin ? "Admin • " : ""}
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </Text>
              <Button onClick={disconnect} size="sm" variant="outline">
                Disconnect
              </Button>
            </HStack>
          ) : (
            <Button onClick={connect} isLoading={isConnecting} size="sm">
              Connect Wallet
            </Button>
          )}
        </Flex>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <Box pb={4} display={{ md: "none" }}>
          <Stack as={"nav"} spacing={4}>
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/groups">Groups</NavLink>
            <NavLink to="/votings">Votings</NavLink>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  )
}

