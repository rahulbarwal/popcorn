import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, BarChart3, Package, Home } from "lucide-react";
import WarehouseFilterCompact from "./WarehouseFilterCompact";

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      current: location.pathname === "/",
    },
    {
      name: "Products",
      href: "/products",
      icon: Package,
      current: location.pathname === "/products",
    },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav
        className="bg-white shadow-sm border-b border-gray-200"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <BarChart3
                  className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600"
                  aria-hidden="true"
                />
                <h1 className="ml-2 text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  <span className="hidden sm:inline">Inventory Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </h1>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 touch-target ${
                        item.current
                          ? "border-blue-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-gray-300 focus:text-gray-700"
                      }`}
                      aria-current={item.current ? "page" : undefined}
                    >
                      <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Warehouse Filter and Mobile menu button */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Warehouse Filter - Desktop */}
              <div className="hidden md:block">
                <WarehouseFilterCompact />
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={toggleMobileMenu}
                  className="touch-target inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label={
                    mobileMenuOpen ? "Close main menu" : "Open main menu"
                  }
                >
                  {mobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="pt-2 pb-3 space-y-1" role="menu">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors duration-200 touch-target ${
                      item.current
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 focus:bg-gray-50 focus:border-gray-300 focus:text-gray-700"
                    }`}
                    role="menuitem"
                    aria-current={item.current ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Warehouse Filter */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Warehouse
                </label>
                <WarehouseFilterCompact className="w-full" />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main
        className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8"
        role="main"
      >
        <div className="space-responsive">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
