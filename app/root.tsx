// root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import "./tailwind.css";
import { Layout, Menu, Typography } from "antd";
import {
  LayoutDashboard,
  Users,
  Tags,
  Award,
  Phone,
  UserCircle,
  GraduationCap, VenusAndMars,
} from "lucide-react";
import { useEffect, useState } from "react";

// Same table list for simplicity – you can refactor this into a separate module if needed
const tableNames = [
  "Person",
  "Geschlecht",
  "Status",
  "Titel",
  "Telefonnummertyp",
  "Rolle",
  "Titeltyp",
];

const { Sider } = Layout;
const { Title } = Typography;

const getIconForTable = (tableName: string) => {
  switch (tableName.toLowerCase()) {
    case "person":
      return <Users className="w-5 h-5" />;
    case "geschlecht":
      return <VenusAndMars className="w-5 h-5" />;
    case "status":
      return <Tags className="w-5 h-5" />;
    case "titel":
      return <Award className="w-5 h-5" />;
    case "telefonnummertyp":
      return <Phone className="w-5 h-5" />;
    case "rolle":
      return <UserCircle className="w-5 h-5" />;
    case "titeltyp":
      return <GraduationCap className="w-5 h-5" />;
    default:
      return <LayoutDashboard className="w-5 h-5" />;
  }
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
      <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
      <Layout className="min-h-screen">
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            theme="light"
            className="border-r border-gray-200"
        >
          <div className="p-4">
            <Title level={4} className="text-center mb-6">
              {collapsed ? "MDB" : "Mitgliederdatenbank"}
            </Title>
          </div>
          <Menu
              mode="inline"
              selectedKeys={[
                location.pathname === "/" ? "dashboard" : location.pathname.replace("/", ""),
              ]}
              onClick={({ key }) => {
                if (key === "dashboard") {
                  navigate("/");
                } else {
                  navigate(`/${key}`);
                }
              }}
              items={[
                {
                  key: "dashboard",
                  icon: <LayoutDashboard className="w-5 h-5" />,
                  label: "Dashboard",
                },
                ...tableNames.map((name) => ({
                  key: name.toLowerCase(),
                  icon: getIconForTable(name),
                  label: name,
                })),
              ]}
          />
        </Sider>
        <Layout className="bg-white">
          {/* Here you inject all page content */}
          {children}
        </Layout>
      </Layout>
      <ScrollRestoration />
      <Scripts />
      </body>
      </html>
  );
}

export default function App() {
  return (
      <LayoutWrapper>
        <Outlet />
      </LayoutWrapper>
  );
}
