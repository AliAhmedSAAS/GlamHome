import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'beautician') return '/beautician/dashboard';
    if (user.role === 'customer') return '/customer/dashboard';
    if (user.role === 'admin') return '/admin';
    return null;
  };

  const dashboardLink = getDashboardLink();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <div className="flex flex-col items-end">
              <span className="font-serif text-xl sm:text-2xl font-bold text-primary leading-none">Kosmospace</span>
              <span className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-muted-foreground/80">Luxe Beauty</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/find-beauticians" className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md transition-colors" data-testid="link-beauticians">
              Find Beauticians
            </Link>
            {!isAuthenticated && (
              <Link href="/become-beautician" className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md transition-colors" data-testid="link-become-beautician">
                Become a Beautician
              </Link>
            )}
            {dashboardLink && (
              <Link href={dashboardLink} className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md transition-colors" data-testid="link-dashboard">
                Dashboard
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-user-menu">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {dashboardLink && (
                    <DropdownMenuItem asChild>
                      <Link href={dashboardLink} data-testid="link-dashboard-dropdown">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Logout error:', error);
                      window.location.href = '/';
                    }
                  }} data-testid="button-logout">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login" data-testid="button-login">
                    Sign In
                  </Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href="/signup" data-testid="button-signup">
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-6 space-y-4">
            <Link href="/find-beauticians" className="text-base font-medium text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-beauticians-mobile" onClick={() => setMobileMenuOpen(false)}>
              Find Beauticians
            </Link>
            {!isAuthenticated && (
              <Link href="/become-beautician" className="text-base font-medium text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-become-beautician-mobile" onClick={() => setMobileMenuOpen(false)}>
                Become a Beautician
              </Link>
            )}
            {dashboardLink && (
              <Link href={dashboardLink} className="text-base font-medium text-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-dashboard-mobile" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            )}
            <div className="flex flex-col gap-3 pt-4 border-t">
              {isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Logout error:', error);
                      window.location.href = '/';
                    }
                  }} data-testid="button-logout-mobile">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/login" data-testid="button-login-mobile" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button variant="default" className="w-full" asChild>
                    <Link href="/signup" data-testid="button-signup-mobile" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
