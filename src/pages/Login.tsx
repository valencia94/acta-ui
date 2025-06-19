import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
} from '@chakra-ui/react';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { skipAuth } from '../env.variables';
import { IkusiLogo } from './IkusiLogo';

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
      <Stack spacing={8} mx="auto" w="sm">
        <IkusiLogo style={{ width: '72px', margin: '0 auto' }} />
        <Heading color="var(--ikusi-dark)">Acta Platform</Heading>
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
            bg="var(--ikusi-green)"
            _hover={{ bg: 'var(--ikusi-teal)' }}
            type="submit"
          >
            Sign in
          </Button>
        </form>
      </Stack>
    </Flex>
  );
}
