import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Form } from "@remix-run/react"
import { prisma } from "~/db.server"
import { useState } from "react"
import {Layout, Table, Button, Modal, Form as AntForm, Input, Card, Typography, Space, Popconfirm, Tooltip} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const statuses = await prisma.status.findMany()
    return json({ statuses })
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const action = formData.get("_action")

    switch (action) {
        case "create":
        case "update":
            const statusId = formData.get("status_id")
            const statusData = {
                status_bezeichnung: formData.get("status_bezeichnung") as string,
            }

            if (action === "create") {
                await prisma.status.create({ data: statusData })
            } else {
                await prisma.status.update({
                    where: { status_id: Number.parseInt(statusId as string) },
                    data: statusData,
                })
            }
            break

        case "delete":
            const deleteId = formData.get("status_id")
            await prisma.status.delete({ where: { status_id: Number.parseInt(deleteId as string) } })
            break
    }

    return null
}

export default function StatusList() {
    const { statuses } = useLoaderData<typeof loader>()
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingStatus, setEditingStatus] = useState<{ status_id: number; status_bezeichnung: string } | null>(null);
    const [form] = AntForm.useForm();

    const handleModalOk = () => {
        form.submit();
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setEditingStatus(null);
        form.resetFields();
    };

    const columns = [
        {
            title: 'Status Bezeichnung',
            dataIndex: 'status_bezeichnung',
            key: 'status_bezeichnung',
        },
        {
            title: '',
            key: 'actions',
            align: 'right',
            render: (_: any, record: any) => (
                <div style={{ textAlign: 'right', width: '100%' }}>
                    <Space>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditingStatus(record);
                                form.setFieldsValue(record);
                                setIsModalVisible(true);
                            }}
                            type="link"
                        >
                            Bearbeiten
                        </Button>
                        <Form method="post">
                            <input type="hidden" name="_action" value="delete" />
                            <input type="hidden" name="status_id" value={record.status_id} />
                            <Popconfirm
                                title="Status löschen"
                                description="Sind Sie sicher, dass Sie diesen Status löschen möchten?"
                                onConfirm={() => {
                                    const form = document.createElement('form');
                                    form.method = 'post';
                                    form.innerHTML = `
                                    <input type="hidden" name="_action" value="delete" />
                                    <input type="hidden" name="status_id" value="${record.status_id}" />
                                `;
                                    document.body.appendChild(form);
                                    form.submit();
                                    document.body.removeChild(form);
                                }}
                                okText="Ja"
                                cancelText="Nein"
                            >
                                <Button type="link" danger icon={<DeleteOutlined />}>
                                    Löschen
                                </Button>
                            </Popconfirm>
                        </Form>
                    </Space>
                </div>
            ),
        },
    ];


    return (
        <Content className="p-6">
            <Card className="mb-6">
                <Space align="center">
                    <Title level={3} style={{ margin: 0 }}>Status Verwaltung</Title>
                    <Tooltip title="Hier können Sie die verschiedenen Status für Mitglieder verwalten. Status können beispielsweise 'Aktiv', 'Inaktiv', 'Ruhend' oder andere Zustände sein, die den aktuellen Stand eines Mitglieds beschreiben.">
                        <InfoCircleOutlined style={{ fontSize: '15px', color: '#1890ff' }} />
                    </Tooltip>
                </Space>
            </Card>

            <Card
                title={<Space><Title level={4} style={{ margin: 0 }}>Status Liste</Title></Space>}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingStatus(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}
                    >
                        Neuer Status
                    </Button>
                }
            >
                <Table
                    dataSource={statuses}
                    columns={columns}
                    rowKey="status_id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingStatus ? "Status bearbeiten" : "Neuer Status"}
                open={isModalVisible}
                onCancel={handleModalCancel}
                footer={[
                    <Button key="cancel" onClick={handleModalCancel}>
                        Abbrechen
                    </Button>,
                    <Button key="submit" type="primary" onClick={() => document.getElementById("status-form")?.requestSubmit()}>
                        {editingStatus ? "Aktualisieren" : "Erstellen"}
                    </Button>,
                ]}
            >
                <form method="post" id="status-form">
                    <input type="hidden" name="_action" value={editingStatus ? "update" : "create"} />
                    {editingStatus && (
                        <input type="hidden" name="status_id" value={editingStatus.status_id} />
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Status Bezeichnung</label>
                        <Input
                            name="status_bezeichnung"
                            required
                            defaultValue={editingStatus?.status_bezeichnung || ""}
                        />
                    </div>
                </form>
            </Modal>


        </Content>
    )
}