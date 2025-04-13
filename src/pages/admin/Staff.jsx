import { useEffect, useState } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Dropdown,
  Row,
  Col,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useAuthConfig } from "../../context/AppState";
import axios from "axios";
import dots from "../../assets/dots.png";
import DotLoader from "react-spinners/DotLoader";

const Staff = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [staffData, setStaffData] = useState([]); // To hold staff data
  const { baseUrl, token, user } = useAuthConfig();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage(); // Hook for message API

  // Show modal
  const showModal = () => {
    setIsModalVisible(true);
  };

  // Close modal and reset form fields
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Handle form submission for adding staff
  const handleSubmit = async (values) => {
    const staffUrl = `${baseUrl}/invite-cashier`;

    const newStaff = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      phone: values.phone,
      guarantorName: values.guarantorName,
      guarantorPhone: values.guarantorPhone,
    };

    try {
      setLoading(true);

      const response = await axios.post(staffUrl, newStaff, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Log the API response
      console.log("API Response:", response.data);

      // Re-fetch the latest staff data
      fetchUsers();

      // Show success message
      messageApi.success("Staff Added Successfully");

      // Close the modal
      setIsModalVisible(false);
      form.resetFields(); // Clear the form
    } catch (error) {
      console.error("Error adding staff:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while adding the staff.";
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff data on load or token change
  const fetchUsers = async () => {
    setLoading(true);
    const staffUrl = `${baseUrl}/users`;
    try {
      const response = await axios.get(staffUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStaffData(response.data.users);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      messageApi.error("Failed to fetch staff data");
    } finally {
      setLoading(false);
    }
  };

  const assignStaff = async (record) => {
    const staffUrl = `${baseUrl}/assign-cashier`;
    const data = {
      cashierId: record._id,
      shopId: user.parentShop,
    };

    try {
      const response = await axios.post(staffUrl, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      messageApi.success("Staff Assigned Successfully");

      fetchUsers(); // Re-fetch after assignment
    } catch (error) {
      console.error("Error assigning staff:", error);
      messageApi.error("Failed to assign staff");
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [baseUrl, token]);

  const blockUser = async (record) => {
    const staffUrl = `${baseUrl}/deactivate`;
    const data = {
      userId: record._id,
    };

    try {
      const response = await axios.put(staffUrl, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Toggle status: Block or Unblock
      const isBlocked = record.isAccountDeactivated;
      const updatedStatus = !isBlocked;

      messageApi.success(
        updatedStatus
          ? "User Blocked Successfully"
          : "User Unblocked Successfully"
      );

      setStaffData((prevData) => {
        return prevData.map((staff) =>
          staff._id === record._id
            ? { ...staff, isAccountDeactivated: updatedStatus }
            : staff
        );
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      messageApi.error("Failed to update user status");
    }
  };

  // Table columns
  const columns = [
    {
      title: "S/N",
      dataIndex: "key",
      key: "key",
      render: (_text, _record, index) => index + 1,
    },
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Guarantor Name",
      dataIndex: "guarantorName",
      key: "guarantorName",
    },
    {
      title: "Guarantor Phone",
      dataIndex: "guarantorPhone",
      key: "guarantorPhone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Assigned",
      dataIndex: "assigned",
      key: "assigned",
      render: (_text, record) => {
        return record.assignedShop ? (
          <span className="text-green-500">Assigned</span>
        ) : (
          <span className="text-red-500">Not Assigned</span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "assigned",
      key: "assigned",
      render: (_text, record) => {
        return record.isAccountDeactivated ? (
          <span className="text-red-500">Blocked</span>
        ) : (
          <span className="text-green-500">Active</span>
        );
      },
    },
    {
      title: "Actions",
      key: "operations",
      render: (_record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: <span>View User</span>,
              },
              {
                key: "edit",
                label: (
                  <span
                    className={_record.assignedShop ? "disable" : ""}
                    onClick={() =>
                      !_record.assignedShop && assignStaff(_record)
                    }
                  >
                    {_record.assignedShop ? "Assigned" : "Assign User"}
                  </span>
                ),
              },
              {
                key: "delete",
                label: (
                  <span onClick={() => blockUser(_record)}>
                    {_record.isAccountDeactivated
                      ? "Unblock User"
                      : "Block User"}
                  </span>
                ),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button>
            <img
              src={dots}
              alt="Actions"
              className="flex items-center justify-center w-1"
            />
          </Button>
        </Dropdown>
      ),
      width: 100,
    },
  ];

  return (
    <div className="p-4">
      {contextHolder}

      <div className="flex justify-between items-center my-4">
        <Button
          type="primary"
          onClick={showModal}
          className="!bg-black"
          size="medium"
        >
          Add Staff <PlusOutlined />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center my-4 h-60 bg-white">
          <DotLoader />
        </div>
      ) : (
        <Table
          dataSource={staffData}
          columns={columns}
          rowKey={(record) => record._id}
          size="small"
          pagination={{
            pageSize: 7,
            position: ["bottomCenter"],
            className: "custom-pagination",
          }}
          className="custom-table"
        />
      )}

      {/* Modal for adding staff */}
      <Modal
        title="Add Staff"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
            phone: "",
            guarantorName: "",
            guarantorPhone: "",
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[
                  { required: true, message: "Please input the first name!" },
                ]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[
                  { required: true, message: "Please input the last name!" },
                ]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please input the email!" },
                  { type: "email", message: "Please input a valid email!" },
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { required: true, message: "Please input the phone number!" },
                ]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="guarantorName"
                label="Guarantor Name"
                rules={[
                  {
                    required: true,
                    message: "Please input the guarantor's name!",
                  },
                ]}
              >
                <Input placeholder="Enter guarantor name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="guarantorPhone"
                label="Guarantor Phone"
                rules={[
                  {
                    required: true,
                    message: "Please input the guarantor's phone!",
                  },
                ]}
              >
                <Input placeholder="Enter guarantor phone" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please input the password!" },
                ]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The two passwords do not match!")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm password" />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end">
            <Button onClick={handleCancel} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Staff;
