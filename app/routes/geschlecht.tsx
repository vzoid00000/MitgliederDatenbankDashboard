// geschlecht.tsx
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { prisma } from "~/db.server";
import { useState, useEffect } from "react";
import {
    Layout,
    Table,
    Button,
    Modal,
    Form as AntForm,
    Input,
    Card,
    Typography,
    Space,
    Tooltip,
    message
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title } = Typography;

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const geschlechter = await prisma.geschlecht.findMany({
        orderBy: { geschlecht_id: 'asc' }
    });
    return json({ geschlechter });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const action = formData.get("_action");

    try {
        switch (action) {
            case "create":
                await prisma.geschlecht.create({
                    data: { geschlecht: formData.get("geschlecht") as string }
                });
                return json({ result: "created" });

            case "update":
                await prisma.geschlecht.update({
                    where: { geschlecht_id: Number(formData.get("geschlecht_id")) },
                    data: { geschlecht: formData.get("geschlecht") as string }
                });
                return json({ result: "updated" });

            case "delete":
                await prisma.geschlecht.delete({
                    where: { geschlecht_id: Number(formData.get("geschlecht_id")) }
                });
                return json({ result: "deleted" });

            case "multiDelete":
                const ids = formData.getAll("geschlecht_ids[]").map(id => Number(id));
                await prisma.geschlecht.deleteMany({
                    where: { geschlecht_id: { in: ids } }
                });
                return json({ result: "multiDeleted", count: ids.length });
        }
    } catch (error: any) {
        console.error("Fehler:", error);
        return json({ result: "error", message: "Ein Fehler ist aufgetreten." });
    }

    return json({ result: "unknown" });
};

export default function GeschlechtList() {
    const { geschlechter } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [form] = AntForm.useForm();
    const [searchText, setSearchText] = useState('');
    const [multiDeleteMode, setMultiDeleteMode] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

    useEffect(() => {
        if (editingItem) {
            form.setFieldsValue(editingItem);
        } else {
            form.resetFields();
        }
    }, [editingItem, form]);

    useEffect(() => {
        if (fetcher.data?.result) {
            const { result, message: msg, count } = fetcher.data;
            switch (result) {
                case "created":
                    message.success("Geschlecht erfolgreich erstellt.");
                    break;
                case "updated":
                    message.success("Geschlecht erfolgreich aktualisiert.");
                    break;
                case "deleted":
                    message.success("Geschlecht erfolgreich gelöscht.");
                    break;
                case "multiDeleted":
                    message.success(`${count} Geschlechter erfolgreich gelöscht.`);
                    break;
                case "error":
                    message.error(msg || "Fehler bei der Aktion.");
                    break;
                default:
                    message.info("Aktion abgeschlossen.");
            }
        }
    }, [fetcher.data]);

    const columns = [
        {
            title: "Geschlecht",
            dataIndex: "geschlecht",
            key: "geschlecht",
            sorter: (a: any, b: any) => a.geschlecht.localeCompare(b.geschlecht, "de", { sensitivity: "base" }),
        },
        {
            title: "",
            key: "actions",
            align: "right",
            render: (_: any, record: any) =>
                !multiDeleteMode && (
                    <Space>
                        <Button type="link" icon={<EditOutlined />} onClick={() => { setEditingItem(record); setIsModalVisible(true); }}>Bearbeiten</Button>
                        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => { setItemToDelete(record); setDeleteModalVisible(true); }}>Löschen</Button>
                    </Space>
                ),
        },
    ];

    const filteredItems = geschlechter.filter(item =>
        item.geschlecht.toLowerCase().includes(searchText.toLowerCase())
    );

    const rowSelection = multiDeleteMode
        ? {
            selectedRowKeys,
            onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as number[]),
        }
        : undefined;

    return (
        <Content className="p-6">
            <Card className="mb-6">
                <Space align="center">
                    <Title level={3} style={{ margin: 0 }}>Geschlechterverwaltung</Title>
                    <Tooltip title="Ein Geschlechtseintrag definiert eine geschlechtliche Zuordnung.">
                        <InfoCircleOutlined style={{ fontSize: 15, color: "#1890ff" }} />
                    </Tooltip>
                </Space>
            </Card>

            <Card
                title={<Title level={4} style={{ margin: 0 }}>Geschlechterliste</Title>}
                extra={
                    <Space>
                        <Button
                            type={multiDeleteMode ? "default" : "primary"}
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingItem(null);
                                setIsModalVisible(true);
                            }}
                            disabled={multiDeleteMode}
                        >
                            Neues Geschlecht
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
                                    selectedRowKeys.forEach(id => formData.append("geschlecht_ids[]", id.toString()));
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
                <Input.Search
                    placeholder="Geschlecht suchen..."
                    allowClear
                    onChange={(e) => setSearchText(e.target.value)}
                    value={searchText}
                    style={{ width: 300, marginBottom: 16 }}
                />
                <Table
                    dataSource={filteredItems}
                    columns={columns}
                    rowKey="geschlecht_id"
                    rowSelection={rowSelection}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Modal: Erstellen / Bearbeiten */}
            <Modal
                title={editingItem ? "Geschlecht bearbeiten" : "Neues Geschlecht"}
                open={isModalVisible}
                onCancel={() => { setIsModalVisible(false); setEditingItem(null); form.resetFields(); }}
                footer={[
                    <Button key="cancel" onClick={() => { setIsModalVisible(false); setEditingItem(null); form.resetFields(); }}>
                        Abbrechen
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={async () => {
                            try {
                                const values = await form.validateFields();

                                if (
                                    editingItem &&
                                    values.geschlecht.trim() === editingItem.geschlecht.trim()
                                ) {
                                    message.info("Keine Änderungen vorgenommen.");
                                    setIsModalVisible(false);
                                    setEditingItem(null);
                                    form.resetFields();
                                    return;
                                }

                                const formData = new FormData();
                                formData.append("_action", editingItem ? "update" : "create");
                                formData.append("geschlecht", values.geschlecht);
                                if (editingItem) {
                                    formData.append("geschlecht_id", editingItem.geschlecht_id.toString());
                                }

                                fetcher.submit(formData, { method: "post" });
                                setIsModalVisible(false);
                                setEditingItem(null);
                                form.resetFields();
                            } catch {
                                // Fehlerbehandlung bereits durch validateFields
                            }
                        }}
                    >
                        {editingItem ? "Aktualisieren" : "Erstellen"}
                    </Button>,
                ]}
            >
                <AntForm form={form} layout="vertical">
                    <AntForm.Item
                        label="Geschlecht"
                        name="geschlecht"
                        rules={[{ required: true, message: "Bitte ein Geschlecht eingeben" }]}
                    >
                        <Input />
                    </AntForm.Item>
                </AntForm>
            </Modal>

            {/* Modal: Löschen */}
            <Modal
                title="Geschlecht löschen"
                open={deleteModalVisible}
                onCancel={() => { setDeleteModalVisible(false); setItemToDelete(null); }}
                footer={[
                    <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
                        Abbrechen
                    </Button>,
                    <Button
                        key="delete"
                        danger
                        type="primary"
                        onClick={() => {
                            if (itemToDelete) {
                                const formData = new FormData();
                                formData.append("_action", "delete");
                                formData.append("geschlecht_id", itemToDelete.geschlecht_id.toString());
                                fetcher.submit(formData, { method: "post" });
                                setDeleteModalVisible(false);
                                setItemToDelete(null);
                            }
                        }}
                    >
                        Ja, löschen
                    </Button>,
                ]}
            >
                <p>
                    Möchten Sie das Geschlecht <strong>{itemToDelete?.geschlecht}</strong> wirklich löschen?
                </p>
            </Modal>
        </Content>
    );
}
