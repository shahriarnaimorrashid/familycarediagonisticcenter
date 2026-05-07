'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TestTube2,
  FileText,
  Printer,
  Database,
  Languages,
  Stethoscope,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useData } from '@/app/context/DataContext';

const navItems = [
  { href: '/', icon: LayoutDashboard, labelKey: 'receptionDesk' as const },
  { href: '/samples', icon: TestTube2, labelKey: 'sampleCollection' as const },
  { href: '/reports', icon: FileText, labelKey: 'reportEntry' as const },
  { href: '/print-report', icon: Printer, labelKey: 'reportPrint' as const },
  { href: '/admin', icon: Settings, labelKey: 'adminPanel' as const },
  { href: '/data-management', icon: Database, labelKey: 'dataManagement' as const },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { t, language, setLanguage, data } = useData();
  const { setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              {language === 'bn' ? data.settings.centerNameBn : data.settings.centerName}
            </span>
            <span className="text-xs text-muted-foreground">
              {language === 'bn' ? 'ডায়াগনস্টিক সেন্টার' : 'Diagnostic Center'}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{language === 'bn' ? 'মেনু' : 'Menu'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} onClick={handleNavClick}>
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
        >
          <Languages className="h-4 w-4" />
          {language === 'bn' ? 'English' : 'বাংলা'}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          {t('developerName')}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppHeader() {
  const { t, language, setLanguage, data } = useData();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-1 items-center gap-2">
        <Stethoscope className="h-6 w-6 text-primary md:hidden" />
        <h1 className="text-lg font-semibold md:text-xl">
          {language === 'bn' ? data.settings.centerNameBn : data.settings.centerName}
        </h1>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{language === 'bn' ? 'English' : 'বাংলা'}</span>
        <span className="sm:hidden">{language === 'bn' ? 'EN' : 'বা'}</span>
      </Button>
    </header>
  );
}
