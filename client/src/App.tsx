import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import FindBeauticians from "@/pages/FindBeauticians";
import BeauticianOnboarding from "@/pages/BeauticianOnboarding";
import BeauticianDashboard from "@/pages/BeauticianDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import CustomerDashboard from "@/pages/CustomerDashboard";
import BeauticianProfile from "@/pages/BeauticianProfile";
import BridalMakeup from "@/pages/BridalMakeup";
import ManicureServices from "@/pages/ManicureServices";
import PedicureServices from "@/pages/PedicureServices";
import LashExtensions from "@/pages/LashExtensions";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/find-beauticians" component={FindBeauticians} />
      <Route path="/become-beautician" component={BeauticianOnboarding} />
      <Route path="/beautician/onboarding" component={BeauticianOnboarding} />
      <Route path="/beautician/dashboard" component={BeauticianDashboard} />
      <Route path="/customer/dashboard" component={CustomerDashboard} />
      <Route path="/beauticians/:id" component={BeauticianProfile} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/services/bridal-makeup" component={BridalMakeup} />
      <Route path="/services/manicure" component={ManicureServices} />
      <Route path="/services/pedicure" component={PedicureServices} />
      <Route path="/services/lash-extensions" component={LashExtensions} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
