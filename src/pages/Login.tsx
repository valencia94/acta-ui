import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Button, Flex, Heading, Image, Stack } from '@chakra-ui/react';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { skipAuth } from '../env.variables';

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const nav = useNavigate();
  const { register, handleSubmit } = useForm<FormData>();

  useEffect(() => {
    if (!skipAuth) {
      signOut().catch(() => {});
    }
  }, []);

  async function onSubmit({ email, password }: FormData) {
    try {
      if (skipAuth) {
        localStorage.setItem('ikusi.jwt', 'dev-token');
      } else {
        await signIn({ username: email, password });
        const { tokens } = await fetchAuthSession();
        const token = tokens?.idToken?.toString() ?? '';
        localStorage.setItem('ikusi.jwt', token);
      }
      nav('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Sign-in failed');
    }
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="white">
      <Stack gap={8} mx="auto" w="sm">
        <Image src="/ikusi-logo.svg" boxSize="72px" mx="auto" />
        <Heading className="text-ikusi-dark">Acta Platform</Heading>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input type="email" {...register('email')} />
          </FormControl>
          <FormControl mt={4} isRequired>
            <FormLabel>Password</FormLabel>
            <Input type="password" {...register('password')} />
          </FormControl>
          <Button
            mt={6}
            w="full"
            className="rounded bg-ikusi-green py-2 text-white hover:bg-ikusi-teal transition-colors"
            type="submit"
          >
            Sign in
          </Button>
        </form>
      </Stack>
    </Flex>
  );
}
