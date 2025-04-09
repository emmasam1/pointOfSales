import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import { Table, Tooltip, Modal, message, Form, Input, Button } from "antd";
import { RiEditLine } from "react-icons/ri";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import DotLoader from "react-spinners/DotLoader";

const Categories = () => {
  const { baseUrl, token, user } = useAuthConfig();
  const [dataSource, setDataSource] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // For category editing modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false); // For "Add Category" modal
  const [loading, setLoading] = useState(false); // This should cover data fetching and actions
  const [form] = Form.useForm();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const { TextArea } = Input;

  const fetchCategories = async () => {
    setLoading(true); 
    const getCat = `${baseUrl}/get-cat`;
    try {
      const response = await axios.get(getCat, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDataSource(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    fetchCategories();
  }, [token, baseUrl]);

  const handleCancel = () => {
    setIsOpen(false);
    form.resetFields();
  };

  const handleCancelCategoryModal = () => {
    setCategoryModalOpen(false);
    form.resetFields();
  };

  const handleDeleteCategory = (record) => {
    Modal.confirm({
      title: "Are you sure you want to delete this category?",
      content: `This action will permanently delete the category: ${record.name}`,
      onOk: async () => {
        try {
          setLoading(true);
          const catDeleteUrl = `${baseUrl}/delete-cat/${record._id}`;
          const response = await axios.delete(catDeleteUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Check for success in response
          if (response.status === 200) {
            messageApi.open({ type: "success", content: "Category deleted successfully" });
            fetchCategories(); // Refetch categories after deletion
          } else {
            messageApi.open({ type: "error", content: "Failed to delete category" });
          }
        } catch (error) {
          messageApi.open({
            type: "error",
            content: error instanceof Error ? error.message : "An error occurred",
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel() {
        // Do nothing on cancel
      },
    });
  };

  const columns = [
    {
      key: "1",
      title: "S/N",
      render: (_, record, index) => index + 1,
      width: 50,
    },
    {
      key: "3",
      title: "Name",
      dataIndex: "name",
      width: 150,
    },
    {
      key: "4",
      title: "Description",
      dataIndex: "description",
      width: 400,
    },
    {
      key: "5",
      title: "Action",
      dataIndex: "action",
      width: 15,
      render: (_, record) => {
        return (
          <div className="flex gap-5">
            <Tooltip placement="bottom" title={"Edit Category"}>
              <RiEditLine
                size={20}
                className="cursor-pointer text-green-700"
                onClick={() => updateCategory(record)}
              />
            </Tooltip>

            <Tooltip placement="bottom" title={"Delete Category"}>
              <DeleteOutlined
                size={20}
                className="cursor-pointer text-red-600"
                onClick={() => handleDeleteCategory(record)} // Show the confirmation modal
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const createCategory = async (values) => {
    const catUrl = `${baseUrl}/create-cat`;

    const data = {
      name: values.name,
      description: values.description,
      shop: user.parentShop,
    };

    try {
      setLoading(true);
      const response = await axios.post(catUrl, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      messageApi.open({ type: "success", content: "Category created successfully" });
      setCategoryModalOpen(false);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      messageApi.open({
        type: "error",
        content: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (record) => {
    setIsOpen(true);
    setSelectedRecord(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
  };

  return (
    <div className="p-2">
      {contextHolder}
      <div className="flex justify-between items-center my-4">
        <Button
          type="primary"
          onClick={() => setCategoryModalOpen(true)}
          className="!bg-black"
        >
          Add Category <PlusOutlined />
        </Button>
      </div>

      {/* Show loading spinner if data is being fetched */}
      {loading ? (
        <div className="flex justify-center items-center my-4 h-60 bg-white">
          <DotLoader />
        </div>
      ) : (
        // Show the table only after the data has been fetched
        <Table
          columns={columns}
          dataSource={dataSource}
          size="small"
          pagination={{
            pageSize: 7,
            position: ["bottomCenter"],
            className: "custom-pagination",
          }}
          className="custom-table"
        />
      )}

      {/* Modal to add a new Category */}
      <Modal
        title="Add Category"
        open={categoryModalOpen}
        onCancel={handleCancelCategoryModal}
        footer={null}
        width={300}
      >
        <Form
          form={form}
          name="category"
          layout="vertical"
          onFinish={createCategory}
        >
          <Form.Item
            label="Category Name"
            name="name"
            className="mb-2"
            rules={[{ required: true, message: "Please input category name!" }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            className="mb-2"
            rules={[{ required: true, message: "Please input category description!" }]}
          >
            <TextArea
              placeholder="Category description"
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="!bg-black"
            >
              {loading ? "Adding..." : "Add Category"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal to Edit an existing Category */}
      <Modal
        title="Update Category"
        open={isOpen}
        onCancel={handleCancel}
        footer={null}
        width={300}
      >
        <Form
          form={form}
          name="updateCategory"
          layout="vertical"
          onFinish={async (values) => {
            const updatedCategory = { ...selectedRecord, ...values };
            try {
              setLoading(true);
              await axios.put(
                `${baseUrl}/update-cat/${selectedRecord._id}`,
                updatedCategory,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              messageApi.open({ type: "success", content: "Category updated successfully" });
              setIsOpen(false);
              form.resetFields();
              fetchCategories();
            } catch (error) {
              messageApi.open({
                type: "error",
                content: error instanceof Error ? error.message : "An error occurred",
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          <Form.Item
            label="Category Name"
            name="name"
            className="mb-2"
            rules={[{ required: true, message: "Please input category name!" }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            className="mb-2"
            rules={[{ required: true, message: "Please input category description!" }]}
          >
            <TextArea
              placeholder="Category description"
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="!bg-black"
            >
              {loading ? "Updating..." : "Update Category"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
