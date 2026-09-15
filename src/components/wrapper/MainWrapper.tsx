/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"
import React, { useEffect, useLayoutEffect } from "react"
// Trigger MainWrapper rebuild to reload translations
import Image from "next/image"
import { ChevronDown, CreditCard, Fuel, LayoutDashboard, LogOut, Package, ReceiptText, Repeat, ShoppingBag, Speaker, User, QrCode, Monitor, Shield, Smartphone, Calculator, BellDot, Pencil, ShieldCheck, ArrowLeft, File } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { usePathname, useRouter, Link } from "@/i18n/routing"
import { useLocale, useTranslations } from "next-intl"
import { clearUserData, getUserData, saveUserData } from "@/utils/auth"
import { isRouteAllowed, DEFAULT_ROLE_ROUTE } from "@/utils/rbac"
import { toast } from "sonner"
import logo from "@/assets/logo/logo2.png";
import { useCustomerSignInMutation } from "@/redux/features/auth/auth.api";
import { useSearchParams } from "next/navigation"
import { SocketEvent, useSocket } from "@/providers/SocketProvider"
import { useGetPendingPaymentOrdersQuery } from "@/redux/features/order/order.api"
import { useSound } from "@/providers/SoundProvider"
import productionApi, { useGetAllProductionsQuery } from "@/redux/features/production/production.api"
import { useAppDispatch } from "@/redux/hooks"
import collectionApi, { useGetAllCollectionQuery } from "@/redux/features/collection/collection.api"



function SidebarBrand() {
  return (
    <Link href="/dashboard" className="flex items-center justify-center group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-1">
      <div className="flex items-center justify-center">
        <Image src={logo} alt="logo" className="h-16 w-30 object-contain group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10" priority />
      </div>
    </Link>
  )
}



function AppSidebar({ windowWidth, }: { windowWidth?: number }) {
  const pathName = usePathname();
  const [user, setUser] = React.useState<any>(null);
  const [profileOpen, setProfileOpen] = React.useState(pathName.startsWith("/profile"));
  const [blinkPayments, setBlinkPayments] = React.useState(false);
  const [blinkProduction, setBlinkProduction] = React.useState(false);
  const [blinkCollection, setBlinkCollection] = React.useState(false);

  const socket = useSocket();
  const sound = useSound();

  const router = useRouter();
  const t = useTranslations("Common");


  const dispatch = useAppDispatch();
  const { refetch: refetchPendingPaymentOrders } = useGetPendingPaymentOrdersQuery();
  const { refetch: refetchAllProductions } = useGetAllProductionsQuery();
  const { refetch: refetchAllCollections } = useGetAllCollectionQuery();


  function handleNewPendingPayment(dataSnapshot: any) {
    console.log("New Pending Payment Detected : ", dataSnapshot)
    setTimeout(refetchPendingPaymentOrders, 10e3);
    handleBlinkPayment();
    sound?.playSound();
  }
  function handleNewProduction(dataSnapshot: any,) {
    console.log("New Order Detected : ", dataSnapshot)
    dispatch(productionApi.util.invalidateTags(["productions"]));
    refetchAllProductions();
    handleBlinkProduction();
    sound?.playSound();
  }
  function handleNewCollection(dataSnapshot: any) {
    console.log("New Collection Detected : ", dataSnapshot)
    dispatch(collectionApi.util.invalidateTags(["collection"]));
    refetchAllCollections();
    handleBlinkCollection();
    sound?.playSound();
  }



  function handleBlinkPayment() {
    setBlinkPayments(true);

    setTimeout(() => {
      setBlinkPayments(false);
      sound?.stopSound();
    }, 1e4);
  }

  function handleBlinkProduction() {
    setBlinkProduction(true);

    setTimeout(() => {
      setBlinkProduction(false);
      sound?.stopSound();
    }, 1e4);
  }
  function handleBlinkCollection() {
    setBlinkCollection(true);

    setTimeout(() => {
      setBlinkCollection(false);
      sound?.stopSound();
    }, 1e4);
  }




  useEffect(
    () => {

      socket?.on(SocketEvent.pendingPayment, (snapshot) => handleNewPendingPayment(snapshot));
      socket?.on(SocketEvent.newOrder, (snapshot) => handleNewProduction(snapshot));
      socket?.on(SocketEvent.orderReady, (snapshot) => handleNewCollection(snapshot));

      function unsubscribe() {
        socket?.off(SocketEvent.pendingPayment);
        socket?.off(SocketEvent.newOrder);
        socket?.off(SocketEvent.orderReady);
      }

      return unsubscribe;
    }
    , [socket]);

  React.useEffect(() => {
    setProfileOpen(pathName.startsWith("/profile"));
  }, [pathName]);

  React.useEffect(() => {
    setUser(getUserData());
  }, [pathName]);

  const handleLogout = () => {
    clearUserData();
    toast.success("Logged out successfully!");
    router.push("/auth/welcome");
  };

  const isMobileView = windowWidth !== undefined ? windowWidth < 768 : (typeof window !== "undefined" ? window.innerWidth < 768 : false);

  const navigationItems = [
    ...(!isMobileView ? [
      { label: t("dashboard"), icon: LayoutDashboard, href: "/dashboard" }
    ] : []),
    { label: t("salesReports"), icon: File, href: "/reports" },
    { label: t("efficiencyReport"), icon: ReceiptText, href: "/efficiency-report" },
    { label: t("menu"), icon: Calculator, href: "/menu" },
    { label: t("collection"), icon: BellDot, href: "/collection" },
    { label: t("inventoryReport"), icon: Package, href: "/inventory-report" },
    { label: t("menuManagement"), icon: Pencil, href: "/menu-management" },
    { label: t("pendingPayments"), icon: CreditCard, href: "/pending-payments" },
    { label: t("paymentVerification"), icon: ShieldCheck, href: "/payment-verification" },
    ...(user?.role?.toUpperCase() === "ADMIN" && isMobileView ? [
      { label: t("dashboard"), icon: LayoutDashboard, href: "/mobile-admin-layout" }
    ] : []),
    ...(user?.role?.toUpperCase() === "OWNER" && isMobileView ? [
      { label: t("dashboard"), icon: LayoutDashboard, href: "/mobile-owner-layout" }
    ] : []),
    { label: t("orderLifeCycle"), icon: Repeat, href: "/order-life-cycle" },
    // { label: t("item"), icon: Utensils, href: "/item" },
    { label: t("productionStation"), icon: Fuel, href: "/production-station" },
    { label: t("production"), icon: Speaker, href: "/production" },
    // { label: t("shiftWorkflow"), icon: CalendarRange, href: "/shift-workflow" },
    { label: t("order"), icon: ShoppingBag, href: "/order" },
  ]

  const profileSubItems = [
    { label: t("profileInformation"), href: "/profile/personal-information" },
    { label: t("users"), href: "/profile/users" },
    { label: t("operatingHours"), href: "/profile/operating-hours" },
  ]

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/80 bg-white">
      <SidebarHeader className="border-b border-slate-200/70 px-2 py-1">
        <SidebarBrand />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigationItems
                .filter((item) => user && isRouteAllowed(user.role, item.href))
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "h-11 rounded-lg px-3 text-sm font-medium transition-colors group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:px-0",
                        item.href === pathName
                          ? "bg-[#1A56DB] text-white shadow-lg shadow-[#1A56DB]/20 hover:bg-[#1A56DB] hover:text-white"
                          : (item.href === "/pending-payments" && blinkPayments) || (item.href === "/production" && blinkProduction) || (item.href === "/collection" && blinkCollection)
                            ? "bg-red-50 text-red-600 animate-pulse border border-red-300"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      )}
                    >
                      <Link href={item.href} className="relative flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 w-full">
                        <item.icon className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        {(item.href === "/pending-payments" && blinkPayments) || (item.href === "/production" && blinkProduction) || (item.href === "/collection" && blinkCollection) && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5 group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-1 group-data-[collapsible=icon]:translate-y-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

              {/* Profile Dropdown */}
              {user && isRouteAllowed(user.role, "/profile") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setProfileOpen(!profileOpen)}
                    tooltip={t("profile")}
                    className={cn(
                      "h-11 rounded-lg px-3 text-sm font-medium transition-colors group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:px-0",
                      profileOpen || pathName.startsWith("/profile")
                        ? "bg-[#1A56DB] text-white shadow-lg shadow-[#1A56DB]/20 hover:bg-[#1A56DB] hover:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    )}
                  >
                    <div className="flex w-full items-center gap-3">
                      <User className="size-4" />
                      <span className="flex-1 group-data-[collapsible=icon]:hidden">{t("profile")}</span>
                      <ChevronDown className={cn("size-4 transition-transform group-data-[collapsible=icon]:hidden", profileOpen && "rotate-180")} />
                    </div>
                  </SidebarMenuButton>

                  {profileOpen && (
                    <div className="mt-1 space-y-1 group-data-[collapsible=icon]:hidden">
                      {profileSubItems.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={cn(
                            "flex h-10 items-center rounded-lg px-10 text-sm font-medium transition-colors",
                            pathName === sub.href
                              ? "text-[#1A56DB] bg-blue-50/50"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                          )}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200/70 p-3">
        <SidebarMenuButton
          onClick={handleLogout}
          tooltip={t("logout")}
          className="h-11 justify-start rounded-2xl px-3 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <div className="flex items-center gap-3 cursor-pointer">
            <LogOut className="size-4" />
            <span>{t("logout")}</span>
          </div>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}

function Topbar({
  selectedDevice,
  onDeviceChange,
  windowWidth,
}: {
  selectedDevice: string;
  onDeviceChange: (device: string) => void;
  windowWidth: number;
}) {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);
  const socket = useSocket();

  React.useEffect(() => {
    setUser(getUserData());
  }, [pathname]);

  const handleDeviceChange = (device: string) => {
    onDeviceChange(device);
  };

  const devices: Record<string, { label: string; icon: React.ComponentType<any> }> = {
    qrcode: { label: "QR Code", icon: QrCode },
    touchscreen: { label: "Touchscreen", icon: Monitor },
    admin: { label: "Admin", icon: Shield },
    service: { label: "Service", icon: Smartphone }
  };

  const SelectedDeviceIcon = devices[selectedDevice]?.icon || QrCode;
  const selectedDeviceLabel = devices[selectedDevice]?.label || "QR Code";

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleLogout = () => {
    clearUserData();
    toast.success("Logged out successfully!");
    router.push("/auth/sign-in");
  };

  const getRoleBasedDisplay = () => {
    if (!user) return { name: "", role: "", email: "" };
    const roleUpper = (user.role || "").toUpperCase();
    let nameFallback = t("restaurantOwner");
    let roleLabel = t("owner");
    let emailFallback = "owner@ypos.com";

    if (roleUpper === "ADMIN") {
      nameFallback = t("admin");
      roleLabel = t("admin");
      emailFallback = "admin@ypos.com";
    } else if (roleUpper === "SERVICE") {
      nameFallback = t("service");
      roleLabel = t("service");
      emailFallback = "service@ypos.com";
    } else if (roleUpper === "USER") {
      nameFallback = t("staff");
      roleLabel = t("staff");
      emailFallback = "staff@ypos.com";
    }

    return {
      name: user.name || nameFallback,
      role: user.role || roleLabel,
      email: user.email || emailFallback
    };
  };

  const displayUser = getRoleBasedDisplay();
  const isMobile = windowWidth < 768;
  const isMobileAdmin = user?.role?.toUpperCase() === "ADMIN" && isMobile;
  const isMobileOwner = user?.role?.toUpperCase() === "OWNER" && isMobile;
  const path = user?.role?.toLowerCase() === "ADMIN" ? "/mobile-admin-layout" : "/mobile-owner-layout";

  return (
    <header className={cn(
      "sticky top-0 z-20 border-b border-slate-200/80 bg-white",
      (pathname === "/mobile-admin-layout" || pathname === "/mobile-owner-layout") && "hidden md:block"
    )}>
      <div className="flex py-3 items-center justify-between gap-2.5 px-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          {isMobileAdmin ? (
            <Link
              href={path}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer outline-none"
            >
              <ArrowLeft className="size-5" />
            </Link>
          ) : isMobileOwner ? (
            <Link
              href={path}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer outline-none"
            >
              <ArrowLeft className="size-5" />
            </Link>
          ) : selectedDevice !== "touchscreen" ? (
            <SidebarTrigger className="-ml-1 text-slate-700 hover:bg-slate-100" />
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-1">
              <div className="flex items-center justify-center">
                <Image src={logo} alt="logo" className="h-16 w-30 object-contain group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10" priority />
              </div>
            </Link>
          )}
          {/* <div className="min-w-0">
            <h1 className="truncate text-[1.05rem] font-semibold tracking-tight text-slate-950 sm:text-[1.15rem]">{t("dashboard")}</h1>
          </div> */}
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          {/* Device Selector Dropdown */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2.5 sm:px-3.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 cursor-pointer outline-none">
                <SelectedDeviceIcon className="size-4 text-slate-500" />
                <span className="hidden sm:inline">{selectedDeviceLabel}</span>
                <ChevronDown className="size-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-lg border border-slate-100 bg-white z-30">
              <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 px-2.5 py-1.5 uppercase tracking-wider">Choose Device</DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              {Object.entries(devices).map(([key, value]) => {
                const IconComponent = value.icon;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleDeviceChange(key)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer outline-none ${selectedDevice === key
                      ? "bg-blue-50 text-[#1A56DB]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <IconComponent className={`size-4 ${selectedDevice === key ? "text-[#1A56DB]" : "text-slate-400"}`} />
                    <span>{value.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu> */}

          <div className="flex items-center rounded-2xl border border-slate-200 bg-[#f3f4f6] p-1 shadow-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLocaleChange("en");
              }}
              className={`rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-all ${locale === "en" ? "bg-white text-[#1A56DB] shadow-[0_1px_3px_rgba(15,23,42,0.12)]" : "text-slate-500 hover:text-slate-700"}`}
            >
              EN
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLocaleChange("id");
              }}
              className={`rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-all ${locale === "id" ? "bg-white text-[#1A56DB] shadow-[0_1px_3px_rgba(15,23,42,0.12)]" : "text-slate-500 hover:text-slate-700"}`}
            >
              ID
            </button>
          </div>

          {user && user.role?.toUpperCase() !== "USER" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 sm:gap-3 text-left outline-none">
                  <div className="relative flex size-10 items-center justify-center rounded-full bg-[#1A56DB] text-white shadow-sm sm:size-11 shrink-0">
                    {user?.photoUrl ? (
                      <Image width={500} height={500} src={user.photoUrl} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <User className="size-5" />
                    )}


                    {/* Socket connectivity indentifier */}
                    <div className="absolute bottom-0 right-0.5 size-2.5 rounded-full" style={{
                      backgroundColor: socket?.connected ? "#0d0" : "#aaa"
                    }}></div>
                  </div>
                  <div className="hidden sm:block min-w-0 leading-tight">
                    <div className="text-sm font-medium text-slate-950 sm:text-base">{displayUser.name}</div>
                    <div className="text-xs text-slate-500 sm:text-sm">{displayUser.role}</div>
                  </div>
                  <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={12} className="w-68 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <DropdownMenuLabel className="px-2 py-1.5">
                  <div className="text-base font-medium text-slate-950">{displayUser.name}</div>
                  <div className="text-sm font-normal text-slate-400">{displayUser.email}</div>
                </DropdownMenuLabel>

                {user && isRouteAllowed(user.role, "/profile") && (
                  <>
                    <DropdownMenuSeparator className="my-1 bg-slate-200" />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-base text-slate-800 focus:bg-slate-50 focus:text-slate-950">
                      <Link href="/profile" className="flex items-center gap-3">
                        <User className="size-4 text-slate-500" />
                        <span>{t("profile")}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="my-1 bg-slate-200" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer rounded-lg px-3 py-2 text-base text-red-500 focus:bg-red-50 focus:text-red-600"
                >
                  <div className="flex w-full items-center gap-3 text-left">
                    <LogOut className="size-4 text-slate-500" />
                    <span>{t("logout")}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

const MainWrapper = ({ children }: { children: React.ReactNode }) => {
  const searchParams = useSearchParams();
  const [customerSignIn] = useCustomerSignInMutation();

  useLayoutEffect(() => {
    const table = searchParams.get("table");
    if (table) localStorage.setItem("table", table);
  }, []);

  const pathName = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [selectedDevice, setSelectedDevice] = React.useState<string>("qrcode");








  const [windowWidth, setWindowWidth] = React.useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);
  const prevWidthRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem("selectedDevice");
    if (saved) {
      setSelectedDevice(saved);
    } else {
      localStorage.setItem("selectedDevice", "qrcode");
    }
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  React.useEffect(() => {
    if (prevWidthRef.current === null) {
      prevWidthRef.current = windowWidth;
      return;
    }

    const wasMobile = prevWidthRef.current < 768;
    const isNowMobile = windowWidth < 768;
    prevWidthRef.current = windowWidth;

    if (wasMobile !== isNowMobile) {
      const currentUser = getUserData();
      if (currentUser) {
        const role = (currentUser.role || "").toUpperCase();
        if (role === "ADMIN") {
          if (isNowMobile) {
            router.push("/mobile-admin-layout");
          } else if (pathName === "/mobile-admin-layout") {
            router.push("/menu");
          }
        } else if (role === "OWNER") {
          if (isNowMobile) {
            router.push("/mobile-owner-layout");
          } else if (pathName === "/mobile-owner-layout") {
            router.push("/menu-management");
          }
        }
      }
    }
  }, [windowWidth, pathName, router]);

  const handleDeviceChange = (device: string) => {
    setSelectedDevice(device);
    localStorage.setItem("selectedDevice", device);
    window.dispatchEvent(new Event("selectedDeviceChanged"));
  };

  React.useEffect(() => {
    const checkAuth = async () => {
      let currentUser = getUserData();

      if (!currentUser && (pathName === "/menu" || pathName.startsWith("/menu/"))) {
        try {
          setIsChecking(true);
          const result = await customerSignIn().unwrap();
          saveUserData(result.data, true);
          window.dispatchEvent(new Event("selectedDeviceChanged"));
          currentUser = result.data;
        } catch (err) {
          console.error("Auto customer login failed:", err);
          setIsAuthorized(false);
          router.push("/auth/welcome");
          setIsChecking(false);
          return;
        }
      }

      if (currentUser) {
        const role = currentUser.role || "";
        const isMobile = windowWidth < 768;

        let allowed = isRouteAllowed(role, pathName);

        const upperRole = role.toUpperCase();
        // Prevent desktop ADMINs from accessing mobile-admin-layout
        if (upperRole === "ADMIN" && !isMobile && pathName === "/mobile-admin-layout") {
          allowed = false;
        }
        // Prevent desktop OWNERs from accessing mobile-owner-layout
        if (upperRole === "OWNER" && !isMobile && pathName === "/mobile-owner-layout") {
          allowed = false;
        }

        if (allowed) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          let defaultRoute = DEFAULT_ROLE_ROUTE[upperRole] || "/auth/welcome";
          if (upperRole === "ADMIN" && isMobile) {
            defaultRoute = "/mobile-admin-layout";
          } else if (upperRole === "OWNER" && isMobile) {
            defaultRoute = "/mobile-owner-layout";
          }
          router.push(defaultRoute);
        }
      } else {
        setIsAuthorized(false);
        router.push("/auth/welcome");
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [pathName, router, windowWidth, customerSignIn]);

  if (isChecking || !isAuthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F7F7]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#1A56DB]"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-[#F7F7F7] text-slate-900">
        {selectedDevice !== "touchscreen" && <AppSidebar windowWidth={windowWidth} />}

        <SidebarInset className="flex min-h-screen flex-col bg-[#F7F7F7]">
          <Topbar selectedDevice={selectedDevice} onDeviceChange={handleDeviceChange} windowWidth={windowWidth} />
          <main className={cn(
            "flex flex-1 flex-col p-4 md:p-6 lg:p-8",
            (pathName === "/mobile-admin-layout" || pathName === "/mobile-owner-layout") && "max-md:p-0"
          )}>{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MainWrapper;
