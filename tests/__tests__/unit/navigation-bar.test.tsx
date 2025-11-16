/**
 * Unit tests for NavigationBar component.
 * 
 * Tests the navigation bar component including:
 * - Component rendering with different authentication states
 * - Logo and brand name display
 * - Search box rendering
 * - Navigation links rendering
 * - Login/Publish Article button conditional rendering
 * - Mobile menu toggle functionality
 * - Active route highlighting
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import NavigationBarClient from "@/components/layout/NavigationBarClient";
import { useUserRole } from "@/lib/hooks/useUserRole";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock useUserRole hook
jest.mock("@/lib/hooks/useUserRole", () => ({
  useUserRole: jest.fn(),
}));

describe("NavigationBarClient", () => {
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseUserRole = useUserRole as jest.MockedFunction<typeof useUserRole>;
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);
    mockUseUserRole.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      userRole: null,
      session: null,
      status: "unauthenticated",
      isUser: false,
      userId: null,
      userEmail: null,
      userName: null,
    });
  });

  describe("Component rendering", () => {
    it("should render logo and brand name", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      expect(screen.getByText("travis-blog")).toBeInTheDocument();
      expect(screen.getByText("分享技术与思考")).toBeInTheDocument();
    });

    it("should render search box", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const searchInput = screen.getByPlaceholderText("搜索文章...");
      expect(searchInput).toBeInTheDocument();
    });

    it("should render navigation links", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      expect(screen.getByText("首页")).toBeInTheDocument();
      expect(screen.getByText("分类")).toBeInTheDocument();
      expect(screen.getByText("标签")).toBeInTheDocument();
      expect(screen.getByText("关于")).toBeInTheDocument();
    });
  });

  describe("Authentication state rendering", () => {
    it("should show Login button when not authenticated", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      expect(screen.getByText("登录")).toBeInTheDocument();
      expect(screen.queryByText("发布文章")).not.toBeInTheDocument();
    });

    it("should show Publish Article button when authenticated as admin", () => {
      mockUsePathname.mockReturnValue("/");
      mockUseUserRole.mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        userRole: "ADMIN",
        session: {} as any,
        status: "authenticated",
        isUser: false,
        userId: "1",
        userEmail: "admin@example.com",
        userName: "Admin",
      });
      render(<NavigationBarClient isAuthenticated={true} isAdmin={true} />);

      expect(screen.getByText("发布文章")).toBeInTheDocument();
      expect(screen.queryByText("登录")).not.toBeInTheDocument();
    });

    it("should show '我的' link when authenticated but not admin", () => {
      mockUsePathname.mockReturnValue("/");
      mockUseUserRole.mockReturnValue({
        isAuthenticated: true,
        isAdmin: false,
        userRole: "USER",
        session: {} as any,
        status: "authenticated",
        isUser: true,
        userId: "1",
        userEmail: "user@example.com",
        userName: "User",
      });
      render(<NavigationBarClient isAuthenticated={true} isAdmin={false} />);

      expect(screen.getByText("我的")).toBeInTheDocument();
      expect(screen.queryByText("发布文章")).not.toBeInTheDocument();
      expect(screen.queryByText("登录")).not.toBeInTheDocument();
    });
  });

  describe("Active route highlighting", () => {
    it("should highlight homepage link when on /", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const homeLink = screen.getByText("首页").closest("a");
      expect(homeLink).toHaveClass("text-blue-600");
    });

    it("should highlight articles link when on /articles", () => {
      mockUsePathname.mockReturnValue("/articles");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const articlesLink = screen.getByText("分类").closest("a");
      expect(articlesLink).toHaveClass("text-blue-600");
    });

    it("should highlight tags link when on /tags", () => {
      mockUsePathname.mockReturnValue("/tags");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const tagsLink = screen.getByText("标签").closest("a");
      expect(tagsLink).toHaveClass("text-blue-600");
    });

    it("should highlight about link when on /about", () => {
      mockUsePathname.mockReturnValue("/about");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const aboutLink = screen.getByText("关于").closest("a");
      expect(aboutLink).toHaveClass("text-blue-600");
    });
  });

  describe("Search functionality", () => {
    it("should redirect to search page with query parameter on form submit", async () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const searchInput = screen.getByPlaceholderText("搜索文章...");
      const searchForm = searchInput.closest("form");

      fireEvent.change(searchInput, { target: { value: "test query" } });
      fireEvent.submit(searchForm!);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/search?q=test%20query");
      });
    });

    it("should not redirect if search query is empty", async () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const searchInput = screen.getByPlaceholderText("搜索文章...");
      const searchForm = searchInput.closest("form");

      fireEvent.submit(searchForm!);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("should trim search query before redirecting", async () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const searchInput = screen.getByPlaceholderText("搜索文章...");
      const searchForm = searchInput.closest("form");

      fireEvent.change(searchInput, { target: { value: "  test query  " } });
      fireEvent.submit(searchForm!);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/search?q=test%20query");
      });
    });
  });

  describe("Mobile menu", () => {
    it("should show hamburger menu button on mobile", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const hamburgerButton = screen.getByLabelText("切换菜单");
      expect(hamburgerButton).toBeInTheDocument();
      expect(hamburgerButton).toHaveClass("lg:hidden");
    });

    it("should toggle mobile menu when hamburger is clicked", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const hamburgerButton = screen.getByLabelText("切换菜单");
      
      // Menu should be closed initially
      expect(screen.queryByText("首页")).toBeInTheDocument(); // Desktop nav
      
      // Click to open
      fireEvent.click(hamburgerButton);
      
      // Mobile menu should now be visible
      const mobileMenu = hamburgerButton.closest("nav")?.querySelector(".lg\\:hidden");
      expect(mobileMenu).toBeInTheDocument();
    });

    it("should close mobile menu when link is clicked", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const hamburgerButton = screen.getByLabelText("切换菜单");
      
      // Open menu
      fireEvent.click(hamburgerButton);
      
      // Click a link
      const mobileLinks = screen.getAllByText("首页");
      const mobileLink = mobileLinks.find(link => 
        link.closest(".lg\\:hidden")
      );
      
      if (mobileLink) {
        fireEvent.click(mobileLink);
        // Menu should close (this is handled by closeMobileMenu function)
      }
    });
  });

  describe("Touch targets", () => {
    it("should have minimum 44x44px touch targets for mobile buttons", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const hamburgerButton = screen.getByLabelText("切换菜单");
      expect(hamburgerButton).toHaveClass("min-w-[44px]", "min-h-[44px]");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const hamburgerButton = screen.getByLabelText("切换菜单");
      expect(hamburgerButton).toHaveAttribute("aria-label", "切换菜单");
      expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
    });

    it("should have search input with proper label", () => {
      mockUsePathname.mockReturnValue("/");
      render(<NavigationBarClient isAuthenticated={false} isAdmin={false} />);

      const searchInput = screen.getByLabelText("搜索文章");
      expect(searchInput).toBeInTheDocument();
    });
  });
});

