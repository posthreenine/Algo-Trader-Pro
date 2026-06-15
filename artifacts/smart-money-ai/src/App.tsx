import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";

// Import pages
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Analyzer from "@/pages/analyzer";
import Journal from "@/pages/journal";
import Statistics from "@/pages/statistics";
import Watchlist from "@/pages/watchlist";
import Admin from "@/pages/admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: { component: any, path: string }) {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (!user) return null;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function AppContent() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} path="/" />} />
        <Route path="/analyzer" component={() => <ProtectedRoute component={Analyzer} path="/analyzer" />} />
        <Route path="/journal" component={() => <ProtectedRoute component={Journal} path="/journal" />} />
        <Route path="/statistics" component={() => <ProtectedRoute component={Statistics} path="/statistics" />} />
        <Route path="/watchlist" component={() => <ProtectedRoute component={Watchlist} path="/watchlist" />} />
        <Route path="/admin" component={() => <ProtectedRoute component={Admin} path="/admin" />} />
        
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
