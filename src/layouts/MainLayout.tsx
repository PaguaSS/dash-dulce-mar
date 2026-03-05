import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useConfigStore } from '../store/configStore';
import {
  LogOut,
  Users,
  LayoutDashboard,
  Folder,
  Globe,
  Calendar,
  MessageSquare,
  BookOpen,
  UserCircle,
  Settings,
  Calculator,
  Receipt,
  FileEdit,
  ChevronDown,
  ChevronRight,
  Share2,
  Sliders,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import CalculatorParamsDialog from '../components/CalculatorParamsDialog';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const getConfig = useConfigStore((state) => state.getConfig);
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({
    website: true, // Default open
  });

  React.useEffect(() => {
    getConfig();
  }, [getConfig]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const menuItems: MenuItem[] = [
    {
      text: t('navigation.dashboard'),
      icon: <LayoutDashboard size={20} />,
      path: '/dashboard',
    },
    {
      text: t('quotations.title'),
      icon: <Calculator size={20} />,
      path: '/dashboard/quotations',
    },
    {
      text: t('navigation.agenda'),
      icon: <Calendar size={20} />,
      path: '/dashboard/agenda',
    },
    {
      text: t('accounting.title'),
      icon: <Receipt size={20} />,
      path: '/dashboard/accounting',
    },
    {
      text: t('clients.title'),
      icon: <UserCircle size={20} />,
      path: '/dashboard/clients',
    },
    {
      text: t('recipes.title'),
      icon: <BookOpen size={20} />,
      path: '/dashboard/recipes',
    },
    {
      text: t('ingredients.title'),
      icon: (
        <Box component="span" sx={{ fontSize: 20 }}>
          🧂
        </Box>
      ),
      path: '/dashboard/ingredients',
    },
    {
      text: t('navigation.users'),
      icon: <Users size={20} />,
      path: '/dashboard/users',
    },
    {
      text: t('navigation.website'),
      icon: <Globe size={20} />,
      children: [
        {
          text: t('navigation.portfolio'),
          icon: <Folder size={20} />,
          path: '/dashboard/portfolio',
        },
        {
          text: t('socialNets.title'),
          icon: <Share2 size={20} />,
          path: '/dashboard/social-nets',
        },
        {
          text: t('socialPosts.title'),
          icon: <MessageSquare size={20} />,
          path: '/dashboard/social-posts',
        },
        {
          text: t('webContent.title'),
          icon: <FileEdit size={20} />,
          path: '/dashboard/web-content',
        },
        {
          text: t('calculatorProducts.title'),
          icon: <Sliders size={20} />,
          path: '/dashboard/calculator-products',
        },
      ],
    },
  ];

  // Flatten menu items for mobile view
  const flatMenuItems = menuItems.flatMap((item) =>
    item.children ? item.children : [item]
  );

  // Check if any child is active for a parent menu
  const isChildActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some((child) => child.path && location.pathname === child.path);
  };

  const renderDesktopMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.path ? location.pathname === item.path : false;
    const isParentActive = isChildActive(item.children);
    const submenuKey = item.text.toLowerCase().replace(/\s+/g, '-');
    const isOpen = openSubmenus[submenuKey] || false;

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                toggleSubmenu(submenuKey);
              } else if (item.path) {
                navigate(item.path);
              }
            }}
            selected={isActive || (hasChildren && isParentActive)}
            sx={{
              pl: 2 + depth * 2,
              '&.Mui-selected': {
                bgcolor: 'rgba(255, 51, 153, 0.08)',
                borderRight: hasChildren ? 'none' : '3px solid #FF3399',
                '&:hover': {
                  bgcolor: 'rgba(255, 51, 153, 0.12)',
                },
              },
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive || isParentActive ? 'primary.main' : 'text.secondary',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: isActive || isParentActive ? 600 : 400,
                color: isActive || isParentActive ? 'primary.main' : 'text.primary',
                fontSize: depth > 0 ? '0.875rem' : '1rem',
              }}
            />
            {hasChildren && (
              <Box sx={{ color: 'text.secondary' }}>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderDesktopMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
          ml: isMobile ? 0 : `${drawerWidth}px`,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{ justifyContent: isMobile ? 'space-between' : 'flex-end' }}
        >
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img
                src="/logo-small.png"
                alt="Dulce Mar"
                style={{ height: 40, marginRight: 8 }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={t('calculatorParams.title')}>
              <IconButton
                onClick={() => setIsSettingsOpen(true)}
                sx={{ mr: 1 }}
                data-testid="settings-button"
                aria-label={t('calculatorParams.title')}
              >
                <Settings size={20} />
              </IconButton>
            </Tooltip>
            <LanguageSwitcher />
            <Tooltip title={t('common.logout')}>
              <IconButton onClick={handleLogout} color="error" sx={{ ml: 1 }}>
                <LogOut size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>

        {isMobile && (
          <Box
            sx={{
              overflowX: 'auto',
              display: 'flex',
              width: '100%',
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            {flatMenuItems.map((item) => {
              if (!item.path) return null;
              const isActive = location.pathname === item.path;
              return (
                <Box
                  key={item.text}
                  onClick={() => navigate(item.path!)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '1 0 auto',
                    minWidth: 70,
                    p: 1,
                    cursor: 'pointer',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    borderBottom: isActive
                      ? '3px solid'
                      : '3px solid transparent',
                    borderColor: isActive ? 'primary.main' : 'transparent',
                    bgcolor: isActive
                      ? 'rgba(255, 51, 153, 0.08)'
                      : 'transparent',
                  }}
                >
                  {item.icon}
                  <Box
                    component="span"
                    sx={{ fontSize: '0.7rem', mt: 0.5, whiteSpace: 'nowrap' }}
                  >
                    {item.text}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </AppBar>

      {!isMobile && (
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src="/logo-small.png" alt="Dulce Mar" style={{ height: 60 }} />
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => renderDesktopMenuItem(item))}
          </List>
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'grey.100',
          p: 3,
          mt: isMobile ? '105px' : '64px',
          ml: isMobile ? 0 : `${drawerWidth}px`,
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>

      <CalculatorParamsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </Box>
  );
};

export default MainLayout;
