import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FileText, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <FileText className="text-primary-foreground text-lg" />
            </div>
            <span className="text-xl font-bold text-foreground">VideoScribe</span>
          </Link>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span data-testid="text-hours-used">
                  {(user as any)?.hoursUsed?.toFixed(1) || 0} / {(user as any)?.hoursLimit || 0.5} min used
                </span>
              </div>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium" data-testid="text-user-initials">
                  {(user as any)?.firstName ? (user as any).firstName.charAt(0) : 'U'}
                  {(user as any)?.lastName ? (user as any).lastName.charAt(0) : ''}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-signin"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-getstarted"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
