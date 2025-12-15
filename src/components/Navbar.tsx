import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, Ticket, Menu, X, Shield, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const isAdmin = userRole === "club_admin" || userRole === "super_admin";
  const isSuperAdmin = userRole === "super_admin";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? "/profile" : "/"} className="flex items-center">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Club Cult
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Events
            </Link>

            {user && (
              <Link
                to="/my-tickets"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Ticket className="w-4 h-4" />
                My Tickets
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}

            {isSuperAdmin && (
              <Link
                to="/super-admin"
                className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4" />
                Super Admin
              </Link>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm hover:shadow-lg transition-shadow">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-semibold truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-full px-6 hover:shadow-lg transition-all">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-sm font-medium text-gray-700 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>

              {user && (
                <Link
                  to="/my-tickets"
                  className="text-sm font-medium text-gray-700 hover:text-primary flex items-center gap-1.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Ticket className="w-4 h-4" />
                  My Tickets
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-gray-700 hover:text-primary flex items-center gap-1.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}

              {isSuperAdmin && (
                <Link
                  to="/super-admin"
                  className="text-sm font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Super Admin
                </Link>
              )}

              {user ? (
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="text-sm font-medium text-destructive flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-full">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
