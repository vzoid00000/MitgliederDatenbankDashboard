import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Input, Card, List, Typography, Badge, Avatar } from 'antd';
import {
    Users,
    Tags,
    Award,
    Phone,
    UserCircle,
    GraduationCap,
    Search,
} from 'lucide-react';
import { prisma } from "~/db.server";
import { useState } from "react";

const { Title } = Typography;

const getIconForTable = (tableName: string) => {
    const iconClass = "w-5 h-5 text-blue-600"; // you can tweak this color if needed

    switch (tableName.toLowerCase()) {
        case 'person': return <Users className={iconClass} />;
        case 'geschlecht': return <UserCircle className={iconClass} />;
        case 'status': return <Tags className={iconClass} />;
        case 'titel': return <Award className={iconClass} />;
        case 'telefonnummertyp': return <Phone className={iconClass} />;
        case 'rolle': return <UserCircle className={iconClass} />;
        case 'titeltyp': return <GraduationCap className={iconClass} />;
        default: return <Users className={iconClass} />;
    }
};


export const meta: MetaFunction = () => [
    { title: "Mitgliederdatenbank Dashboard" },
    { name: "description", content: "Mitgliederdatenbank" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const tables = [
        { name: "Person", count: await prisma.person.count() },
        { name: "Geschlecht", count: await prisma.geschlecht.count() },
        { name: "Status", count: await prisma.status.count() },
        { name: "Titel", count: await prisma.titel.count() },
        { name: "Telefonnummertyp", count: await prisma.telefonnummer_typ.count() },
        { name: "Rolle", count: await prisma.rolle.count() },
        { name: "Titeltyp", count: await prisma.titel_typ.count() },
    ];
    return json({ tables });
};

export default function Index() {
    const { tables } = useLoaderData<typeof loader>();
    const [searchText, setSearchText] = useState('');

    const filteredTables = tables.filter(table =>
        table.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <>
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <Title level={3} className="mb-0">Dashboard Overview</Title>
                <Input
                    placeholder="Search tables..."
                    prefix={<Search className="w-4 h-4 text-gray-400" />}
                    className="max-w-xs"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />
            </div>

            <div className="p-6">
                <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={filteredTables}
                    renderItem={table => (
                        <List.Item>
                            <Link to={`/${table.name.toLowerCase()}`}>
                                <Card hoverable className="w-full cursor-pointer transition-all duration-300 hover:shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <Avatar
                                                size="large"
                                                className="bg-blue-50 flex items-center justify-center"
                                                icon={getIconForTable(table.name)}
                                            />
                                            <div>
                                                <Title level={5} className="mb-0">{table.name}</Title>
                                                <Typography.Text type="secondary">
                                                    Manage {table.name.toLowerCase()} entries
                                                </Typography.Text>
                                            </div>
                                        </div>
                                        <Badge
                                            count={table.count}
                                            className="cursor-pointer"
                                            style={{
                                                backgroundColor: '#1890ff',
                                                fontSize: '14px',
                                                padding: '0 8px',
                                            }}
                                        />
                                    </div>
                                </Card>
                            </Link>
                        </List.Item>
                    )}
                />
            </div>
        </>
    );
}
