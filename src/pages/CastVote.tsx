import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  useToast,
  RadioGroup,
  Radio,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormControl,
  FormLabel,
  Input,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Identity, generateProof } from "@semaphore-protocol/core";
import { uuidToHex } from "../utils/conversion";
import { Voting } from "../services/api";
//import { decryptPrivateKey } from "@/utils/decrypt_identity";

export default function CastVote() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { address } = useAuth();
  const [selectedOption, setSelectedOption] = useState("");
  const [groupUuid, setGroupUuid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingIdentity, setIsFetchingIdentity] = useState(false);
  const toast = useToast();

  const [votingDetails, setVotingDetails] = useState<Voting | null>(null)
  const [isLoadingVotingDetails, setIsLoadingVotingDetails] = useState(false)

  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
    { value: "4", label: "Option 4" },
  ];

  // Fetch and decrypt identity when address changes
  useEffect(() => {
    const fetchIdentity = async () => {
        if (!address) return;

        setIsFetchingIdentity(true);
        setError(null);

        try {
            // Get the encrypted identity from server
            const identityData = await api.createOrGetUserIdentity(address);

            if (!identityData?.encryptedPrivateKey || !identityData?.salt) {
                throw new Error('Invalid identity data received from server');
            }

            // Decrypt the private key
            /**const privateKey = await decryptPrivateKey(
                identityData.encryptedPrivateKey,
                address,
                identityData.salt
            );
            **/
            // Validate the private key


            // Import the identity
            const userIdentity = Identity.import(identityData.encryptedPrivateKey);

            setIdentity(userIdentity);
        } catch (error) {
            console.error("Error fetching identity:", error);
            setError(error instanceof Error ? error.message : 'Failed to load your identity');
        } finally {
            setIsFetchingIdentity(false);
        }
    };

    const fetchVotingDetails = async () => {
      if (!uuid) return

      setIsLoadingVotingDetails(true)
      try {
        const votings = await api.getAllVotings()
        const voting = votings.find(v => v.uuid === uuid)
        if (voting) {
          setVotingDetails(voting)
        }
      } catch (error) {
        console.error("Error fetching voting details:", error)
        setError(error instanceof Error ? error.message : "Failed to load voting details")
      } finally {
        setIsLoadingVotingDetails(false)
      }
    }
    fetchVotingDetails()
    fetchIdentity();
}, [address]);



  const handleCastVote = async () => {
    if (!selectedOption) {
      toast({
        title: "Error",
        description: "Please select an option",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!groupUuid) {
      toast({
        title: "Error",
        description: "Please enter a group UUID",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!uuid || !identity) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Get merkle proof
      const merkleProofResponse = await api.getMerkleProof(
        groupUuid,
        identity.commitment.toString()
      );

      // 2. Generate ZK proof
      const scope = uuidToHex(uuid);
      const proof = await generateProof(
        identity,
        merkleProofResponse,   // i dont even know what's up, but it works lol
        Number.parseInt(selectedOption),
        scope
      );

      // 3. Submit vote
      const payload = {
        group_uuid: groupUuid,
        proof: proof,
      };

      await api.castVote(uuid, payload);

      toast({
        title: "Success",
        description: "Your vote has been cast successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate(`/votings/${uuid}`);
    } catch (error) {
      console.error("Error casting vote:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to cast vote. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <Box>
        <Heading mb={6}>Cast Vote</Heading>
        <Card>
          <CardBody>
            <Text>Please connect your wallet to cast a vote.</Text>
          </CardBody>
        </Card>
      </Box>
    );
  }

  if (isFetchingIdentity) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!identity) {
    return (
      <Box>
        <Heading mb={6}>Cast Vote</Heading>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Identity Not Found</AlertTitle>
          <AlertDescription>
            You don't have a voting identity. Please create one first.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6}>Cast Your Vote</Heading>
      {votingDetails && (
    <Text
      fontSize="36px"
      fontWeight="bold"
      mb={6}
      color="blue.600"
      textAlign="center"
    >
      {votingDetails.name}
    </Text>
  )}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Group Information</Heading>
        </CardHeader>
        <CardBody>
          <FormControl mb={4}>
            <FormLabel>Group UUID</FormLabel>
            <Input
              value={groupUuid}
              onChange={(e) => setGroupUuid(e.target.value)}
              placeholder="Enter the UUID of the group you belong to"
            />
          </FormControl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Select an Option</Heading>
        </CardHeader>
        <CardBody>
          <RadioGroup onChange={setSelectedOption} value={selectedOption}>
            <Stack direction="column" spacing={4}>
              {options.map((option) => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </CardBody>
        <CardFooter>
          <Button
            colorScheme="blue"
            onClick={handleCastVote}
            isLoading={isLoading}
            isDisabled={!selectedOption || !groupUuid}
          >
            Cast Vote
          </Button>
        </CardFooter>
      </Card>
    </Box>
  );
}