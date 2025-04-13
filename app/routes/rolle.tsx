// RolleList.tsx
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { prisma } from "~/db.server";
import { useState, useEffect } from "react";
import { Layout, Table, Button, Modal, Form as AntForm, Input, Card, Typography, Space, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title } = Typography;

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const rollen = await prisma.rolle.findMany({ orderBy: { rolle_id: "asc" } });
    return json({ rollen });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const action = formData.get("_action");

    try {
        switch (action) {
            case "create": {
                await prisma.rolle.create({
                    data: {
                        rolle_bezeichnung: formData.get("rolle_bezeichnung") as string,
                    },
                });
                return json({ result: "created" });
            }

            case "update": {
                const rolleId = Number(formData.get("rolle_id"));
                await prisma.rolle.update({
                    where: { rolle_id: rolleId },
                    data: {
                        rolle_bezeichnung: formData.get("rolle_bezeichnung") as string,
                    },
                });
                return json({ result: "updated" });
            }

            case "delete": {
                const deleteId = Number(formData.get("rolle_id"));
                await prisma.rolle.delete({ where: { rolle_id: deleteId } });
                return json({ result: "deleted" });
            }

            case "multiDelete": {
                const ids = formData.getAll("rolle_ids[]").map(id => Number(id));
                await prisma.rolle.deleteMany({
                    where: { rolle_id: { in: ids } }
                });
                return json({ result: "multiDeleted", count: ids.length });
            }
        }
    } catch (error: any) {
        console.error("Action Error:", error);
        return json({ result: "error", message: "Ein Fehler ist aufgetreten." });
    }

    return json({ result: "unknown" });
};

export default function RolleList() {
    const { rollen } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRolle, setEditingRolle] = useState<{ rolle_id: number; rolle_bezeichnung: string } | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [rolleToDelete, setRolleToDelete] = useState<{ rolle_id: number; rolle_bezeichnung: string } | null>(null);
    const [form] = AntForm.useForm();
    const [searchText, setSearchText] = useState('');
    const [multiDeleteMode, setMultiDeleteMode] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

    useEffect(() => {
        if (editingRolle) {
            form.setFieldsValue(editingRolle);
        } else {
            form.resetFields();
        }
    }, [editingRolle, form]);

    useEffect(() => {
        if (fetcher.data?.result) {
            switch (fetcher.data.result) {
                case "created":
                    message.success("Rolle erfolgreich erstellt.");
                    break;
                case "updated":
                    message.success("Rolle erfolgreich aktualisiert.");
                    break;
                case "deleted":
                    message.success("Rolle erfolgreich gelöscht.");
                    break;
                case "multiDeleted":
                    message.success(`${fetcher.data.count} Rollen erfolgreich gelöscht.`);
                    break;
                case "error":
                    message.error(fetcher.data?.message || "Fehler bei der Aktion.");
                    break;
                default:
                    message.info("Aktion abgeschlossen.");
            }
        }
    }, [fetcher.data]);

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingRolle(null);
        form.resetFields();
    };

    const rowSelection = multiDeleteMode
        ? {
            selectedRowKeys,
            onChange: (newSelectedRowKeys: React.Key[]) => {
                setSelectedRowKeys(newSelectedRowKeys as number[]);
            },
        }
        : undefined;

    const columns = [
        {
            title: 'Rollen Bezeichnung',
            dataIndex: 'rolle_bezeichnung',
            key: 'rolle_bezeichnung',
            sorter: (a: any, b: any) =>
                a.rolle_bezeichnung.localeCompare(b.rolle_bezeichnung, 'de', { sensitivity: 'base' }),
            sortDirections: ['ascend', 'descend'],
        },
        {
            title: '',
            key: 'actions',
            align: 'right',
            render: (_: any, record: any) =>
                !multiDeleteMode && (
                    <div style={{ textAlign: 'right', width: '100%' }}>
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => {
                                    setEditingRolle(record);
                                    setIsModalVisible(true);
                                }}
                                type="link"
                            >
                                Bearbeiten
                            </Button>
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    setRolleToDelete(record);
                                    setDeleteModalVisible(true);
                                }}
                            >
                                Löschen
                            </Button>
                        </Space>
                    </div>
                ),
        },
    ];

    const filteredRollen = rollen.filter(rolle =>
        rolle.rolle_bezeichnung.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Content className="p-6">
            <Card className="mb-6">
                <Space align="center">
                    <Title level={3} style={{ margin: 0 }}>Rollen Verwaltung</Title>
                    <Tooltip title="Eine Rolle definiert die Funktion einer Person im Verein, z.B. Mitglied, Trainer oder Vorstand.">
                        <InfoCircleOutlined style={{ fontSize: '15px', color: '#1890ff' }} />
                    </Tooltip>
                </Space>
            </Card>

            <Card
                title={<Space><Title level={4} style={{ margin: 0 }}>Rollen Liste</Title></Space>}
                extra={
                    <Space>
                        <Button
                            type={multiDeleteMode ? "default" : "primary"}
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingRolle(null);
                                setIsModalVisible(true);
                            }}
                            disabled={multiDeleteMode}
                        >
                            Neue Rolle
                        </Button>

                        <Button
                            type={multiDeleteMode ? "default" : "dashed"}
                            danger={multiDeleteMode}
                            onClick={() => {
                                setMultiDeleteMode(!multiDeleteMode);
                                setSelectedRowKeys([]);
                            }}
                        >
                            {multiDeleteMode ? "Mehrfachauswahl beenden" : "Mehrere löschen"}
                        </Button>

                        {multiDeleteMode && selectedRowKeys.length > 0 && (
                            <Button
                                danger
                                type="primary"
                                onClick={() => {
                                    const formData = new FormData();
                                    formData.append("_action", "multiDelete");
                                    selectedRowKeys.forEach((id) =>
                                        formData.append("rolle_ids[]", id.toString())
                                    );
                                    fetcher.submit(formData, { method: "post" });

                                    setSelectedRowKeys([]);
                                    setMultiDeleteMode(false);
                                }}
                            >
                                Auswahl löschen ({selectedRowKeys.length})
                            </Button>
                        )}
                    </Space>
                }
            >
                <div style={{ marginBottom: 16 }}>
                    <Input.Search
                        placeholder="Rolle suchen..."
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        value={searchText}
                        style={{ width: 300 }}
                    />
                </div>

                <Table
                    dataSource={filteredRollen}
                    columns={columns}
                    rowKey="rolle_id"
                    pagination={{ pageSize: 10 }}
                    rowSelection={rowSelection}
                />
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                title={editingRolle ? "Rolle bearbeiten" : "Neue Rolle"}
                open={isModalVisible}
                onCancel={handleModalCancel}
                footer={[
                    <Button key="cancel" onClick={handleModalCancel}>
                        Abbrechen
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={async () => {
                            try {
                                const values = await form.validateFields();

                                if (
                                    editingRolle &&
                                    values.rolle_bezeichnung.trim() === editingRolle.rolle_bezeichnung.trim()
                                ) {
                                    message.info("Keine Änderungen vorgenommen.");
                                    setIsModalVisible(false);
                                    setEditingRolle(null);
                                    form.resetFields();
                                    return;
                                }

                                const formData = new FormData();
                                formData.append("_action", editingRolle ? "update" : "create");
                                formData.append("rolle_bezeichnung", values.rolle_bezeichnung);
                                if (editingRolle) {
                                    formData.append("rolle_id", editingRolle.rolle_id.toString());
                                }
                                fetcher.submit(formData, { method: "post" });

                                setIsModalVisible(false);
                                setEditingRolle(null);
                                form.resetFields();
                            } catch (error) {
                                // validation failed
                            }
                        }}
                    >
                        {editingRolle ? "Aktualisieren" : "Erstellen"}
                    </Button>,
                ]}
            >
                <AntForm form={form} layout="vertical">
                    <AntForm.Item
                        label="Rollen Bezeichnung"
                        name="rolle_bezeichnung"
                        rules={[{ required: true, message: "Bitte geben Sie eine Bezeichnung ein" }]}
                    >
                        <Input />
                    </AntForm.Item>
                </AntForm>
            </Modal>

            {/* Delete Modal */}
            <Modal
                title="Rolle löschen"
                open={deleteModalVisible}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setRolleToDelete(null);
                }}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
                        Abbrechen
                    </Button>,
                    <Button
                        key="delete"
                        danger
                        type="primary"
                        onClick={() => {
                            if (rolleToDelete) {
                                const formData = new FormData();
                                formData.append("_action", "delete");
                                formData.append("rolle_id", rolleToDelete.rolle_id.toString());
                                fetcher.submit(formData, { method: "post" });

                                setDeleteModalVisible(false);
                                setRolleToDelete(null);
                            }
                        }}
                    >
                        Ja, löschen
                    </Button>,
                ]}
            >
                <p>
                    Möchten Sie die Rolle <strong>{rolleToDelete?.rolle_bezeichnung}</strong> wirklich löschen?
                </p>
            </Modal>
        </Content>
    );
}
