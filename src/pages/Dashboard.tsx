"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Flex,
  Divider,
  Spinner,
} from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"
import { FiUsers, FiCheckSquare } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"
import { api } from "../services/api"

export default function Dashboard() {
  const { address, isAdmin } = useAuth()
  const [groupCount, setGroupCount] = useState<number | null>(null)
  const [votingCount, setVotingCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchCounts = async () => {
      if (!address) return

      setIsLoading(true)
      try {
        const [groups, votings] = await Promise.all([api.getAllGroups(), api.getAllVotings()])

        setGroupCount(groups.length)
        setVotingCount(votings.length)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCounts()
  }, [address])

  return (
    <Box>
      <Heading mb={6}>Dashboard</Heading>

      {!address ? (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              Welcome to zkVoting
            </Heading>
            <Text mb={4}>
              zkVoting is an anonymous voting system based on zero-knowledge proofs. Connect your wallet to get
              started.
            </Text>
          </CardBody>
        </Card>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
            <Card>
              <CardBody>
                <Stat>
                  <Flex align="center">
                    <Icon as={FiUsers} boxSize={6} mr={2} color="blue.500" />
                    <StatLabel fontSize="lg">Groups</StatLabel>
                  </Flex>
                  <StatNumber>{isLoading ? <Spinner size="sm" /> : (groupCount ?? "-")}</StatNumber>
                  <StatHelpText>Voting groups you belong to</StatHelpText>
                </Stat>
              </CardBody>
              <Divider />
              <CardFooter>
                <Button as={RouterLink} to="/groups" variant="ghost" size="sm">
                  View Groups
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <Flex align="center">
                    <Icon as={FiCheckSquare} boxSize={6} mr={2} color="green.500" />
                    <StatLabel fontSize="lg">Votings</StatLabel>
                  </Flex>
                  <StatNumber>{isLoading ? <Spinner size="sm" /> : (votingCount ?? "-")}</StatNumber>
                  <StatHelpText>Active voting events</StatHelpText>
                </Stat>
              </CardBody>
              <Divider />
              <CardFooter>
                <Button as={RouterLink} to="/votings" variant="ghost" size="sm">
                  View Votings
                </Button>
              </CardFooter>
            </Card>
          </SimpleGrid>

          {isAdmin && (
            <Card>
              <CardHeader>
                <Heading size="md">Admin Actions</Heading>
              </CardHeader>
              <CardBody>
                <Text mb={4}>As an admin, you can create new groups and voting events.</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Button as={RouterLink} to="/groups" colorScheme="blue">
                    Manage Groups
                  </Button>
                  <Button as={RouterLink} to="/votings" colorScheme="green">
                    Manage Votings
                  </Button>
                </SimpleGrid>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </Box>
  )
}

