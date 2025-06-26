// src/pages/Login.tsx
import { Auth } from '@aws-amplify/auth';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { skipAuth } from '@/env.variables';

interface FormData {
  email: string;
  password: string;
}

const logoSrc = '/assets/ikusi-logo.png';

export default function Login() {
  const nav = useNavigate();
  const { register, handleSubmit } = useForm<FormData>();

  useEffect(() => {
    if (!skipAuth) {
      Auth.signOut().catch(() => {});
    }
  }, []);

  async function onSubmit({ email, password }: FormData) {
    try {
      if (skipAuth) {
        localStorage.setItem('ikusi.jwt', 'dev-token');
      } else {
        await Auth.signIn({ username: email, password });
        const session = await Auth.currentSession();
        const token = session.getIdToken().getJwtToken();
        localStorage.setItem('ikusi.jwt', token);
      }
      nav('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Sign-in failed');
    }
  }

  const MotionButton = motion.button;

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary/5 p-6">
      <div className="w-full max-w-md backdrop-blur-md bg-white/30 shadow-xl rounded-2xl p-10">
        <img
          src={logoSrc}
          alt="Ikusi logo"
          className="mx-auto h-16 mb-6"
        />
        <h1 className="text-center text-2xl font-semibold text-secondary mb-8">
          Acta Platform
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder="Email"
              required
              {...register('email')}
              className="
                peer h-10 w-full
                border-b-2 border-secondary
                bg-transparent placeholder-transparent
                focus:border-primary focus:outline-none focus:ring-0
              "
            />
            <label
              htmlFor="email"
              className="
                absolute left-0 -top-3.5 text-sm text-secondary
                transition-all
                peer-placeholder-shown:top-2 peer-placeholder-shown:text-base
                peer-focus:-top-3.5 peer-focus:text-sm
              "
            >
              Email
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              type="password"
              placeholder="Password"
              required
              {...register('password')}
              className="
                peer h-10 w-full
                border-b-2 border-secondary
                bg-transparent placeholder-transparent
                focus:border-primary focus:outline-none focus:ring-0
              "
            />
            <label
              htmlFor="password"
              className="
                absolute left-0 -top-3.5 text-sm text-secondary
                transition-all
                peer-placeholder-shown:top-2 peer-placeholder-shown:text-base
                peer-focus:-top-3.5 peer-focus:text-sm
              "
            >
              Password
            </label>
          </div>

          <MotionButton
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="
              w-full rounded-md
              bg-primary hover:bg-accent
              py-2 text-white
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent
              transition
            "
          >
            Sign in
          </MotionButton>
        </form>
      </div>
    </div>
  );
}
