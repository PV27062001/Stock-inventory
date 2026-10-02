
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingBasket, BookOpen } from 'lucide-react';
import { signInWithGoogle } from '@/firebase/auth/auth-service';
import { useAuthUser } from '@/firebase/auth/use-auth-user';

export default function LoginPage() {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      // Optionally, display an error message to the user
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <main className="min-h-screen p-6 flex flex-col justify-center items-center bg-background">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <div className="flex gap-2">
            <ShoppingBasket className="w-5 h-5 text-green-700" />
            <BookOpen className="w-5 h-5 text-blue-700" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-primary mb-2">SimpleStock</h1>
        <p className="text-muted-foreground text-lg font-medium mb-1">Home Inventory & Ledger</p>
        <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
          Manage your inventory and rental records all in one place. Track groceries, medicines, and customer transactions effortlessly.
        </p>
      </div>

      <Card className="w-full max-w-sm p-8 border-none shadow-xl rounded-[2.5rem]">
        <h2 className="text-2xl font-bold mb-2 text-center">Welcome</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Sign in to access Inventory and Ledger</p>
        
        <Button 
          variant="outline" 
          onClick={handleGoogleSignIn}
          className="w-full h-14 text-lg rounded-2xl border-2"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5 mr-2" alt="Google" />
          Sign in with Google
        </Button>
      </Card>
    </main>
  );
}
